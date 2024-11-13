const tf = require('@tensorflow/tfjs-node');
const EventEmitter = require('events');

class PolicyNetwork extends EventEmitter {
    constructor() {
        super();
        
        // Advanced network architecture
        this.networks = {
            actor: this.initializeActorNetwork(),
            critic: this.initializeCriticNetwork(),
            target: this.initializeTargetNetwork()
        };

        // Policy network configuration
        this.config = {
            architecture: {
                actor: {
                    layers: [128, 256, 128],  // Hidden layer sizes
                    activation: 'relu',        // Hidden layer activation
                    outputSize: 3,             // Buy, sell, hold actions
                    dropout: 0.2              // Dropout rate
                },
                critic: {
                    layers: [128, 256, 128],
                    activation: 'relu',
                    outputSize: 1,
                    dropout: 0.2
                }
            },
            training: {
                batchSize: 64,
                epochs: 10,
                learningRate: {
                    actor: 0.0001,
                    critic: 0.001,
                    decay: 0.995
                },
                clipRange: 0.2,              // PPO clip range
                entropyCoef: 0.01,           // Entropy coefficient
                valueCoef: 0.5              // Value loss coefficient
            },
            exploration: {
                initial: 1.0,
                final: 0.01,
                decay: 0.995,
                noise: {
                    mean: 0,
                    std: 0.1
                }
            }
        };

        // Initialize state
        this.policyState = {
            episodes: 0,
            steps: 0,
            gradients: new Map(),
            performance: new Map(),
            exploration: this.config.exploration.initial
        };

        // Start policy network
        this.startPolicyNetwork();
    }

    async makeDecision(state) {
        console.log(`🤔 Making Trading Decision...`);

        try {
            // Generate policy distribution
            const policyDist = await this.generatePolicyDistribution(state);
            
            // Sample action from distribution
            const action = await this.sampleAction(policyDist);
            
            // Calculate action probability
            const actionProb = await this.calculateActionProbability(policyDist, action);
            
            return {
                action,
                probability: actionProb,
                distribution: policyDist,
                exploration: this.policyState.exploration
            };

        } catch (error) {
            console.error('❌ Decision Error:', error.message);
            this.handleDecisionError(error);
        }
    }

    async generatePolicyDistribution(state) {
        const stateTensor = tf.tensor2d([state]);
        
        // Get actor network output
        const actorOutput = await this.networks.actor.predict(stateTensor);
        
        // Apply softmax to get probability distribution
        const distribution = tf.softmax(actorOutput);
        
        // Add exploration noise if in exploration phase
        if (this.shouldExplore()) {
            return this.addExplorationNoise(distribution);
        }
        
        return distribution;
    }

    async sampleAction(distribution) {
        // Convert distribution to probabilities
        const probs = await distribution.data();
        
        // Sample action based on probabilities
        let cumSum = 0;
        const random = Math.random();
        
        for (let i = 0; i < probs.length; i++) {
            cumSum += probs[i];
            if (random < cumSum) {
                return i;
            }
        }
        
        return probs.length - 1;
    }

    async updatePolicy(experience) {
        const {state, action, reward, nextState, done} = experience;
        
        // Calculate advantages
        const advantages = await this.calculateAdvantages(state, reward, nextState, done);
        
        // Update actor network
        const actorLoss = await this.updateActor(state, action, advantages);
        
        // Update critic network
        const criticLoss = await this.updateCritic(state, reward, nextState, done);
        
        // Update target network if needed
        if (this.shouldUpdateTarget()) {
            await this.updateTargetNetwork();
        }
        
        return {
            actorLoss,
            criticLoss,
            advantages
        };
    }

    async updateActor(state, action, advantages) {
        const stateTensor = tf.tensor2d([state]);
        const actionTensor = tf.tensor1d([action]);
        const advantagesTensor = tf.tensor1d(advantages);

        return tf.tidy(() => {
            // Get old policy probabilities
            const oldProbs = this.networks.actor.predict(stateTensor);
            const oldActionProbs = tf.gather(oldProbs, actionTensor);
            
            // Calculate policy ratio
            const newProbs = this.networks.actor.predict(stateTensor);
            const newActionProbs = tf.gather(newProbs, actionTensor);
            const ratio = tf.div(newActionProbs, oldActionProbs);
            
            // Calculate PPO loss
            const surr1 = tf.mul(ratio, advantagesTensor);
            const surr2 = tf.mul(
                tf.clipByValue(ratio, 1 - this.config.training.clipRange, 1 + this.config.training.clipRange),
                advantagesTensor
            );
            
            // Add entropy bonus
            const entropy = this.calculatePolicyEntropy(newProbs);
            
            return tf.neg(tf.mean(
                tf.minimum(surr1, surr2)
                .add(tf.mul(entropy, this.config.training.entropyCoef))
            ));
        });
    }

    async updateCritic(state, reward, nextState, done) {
        const stateTensor = tf.tensor2d([state]);
        const nextStateTensor = tf.tensor2d([nextState]);
        
        return tf.tidy(() => {
            // Get current value estimate
            const valueEstimate = this.networks.critic.predict(stateTensor);
            
            // Calculate target value
            const nextValue = done ? 0 : this.networks.target.predict(nextStateTensor);
            const targetValue = reward + this.config.training.valueCoef * nextValue;
            
            // Calculate value loss
            return tf.mean(tf.square(tf.sub(targetValue, valueEstimate)));
        });
    }

    calculatePolicyEntropy(probs) {
        return tf.tidy(() => {
            const logProbs = tf.log(probs);
            return tf.neg(tf.sum(tf.mul(probs, logProbs)));
        });
    }

    shouldExplore() {
        return Math.random() < this.policyState.exploration;
    }

    updateExplorationRate() {
        this.policyState.exploration = Math.max(
            this.config.exploration.final,
            this.policyState.exploration * this.config.exploration.decay
        );
    }

    startPolicyNetwork() {
        // Real-time decision monitoring
        setInterval(() => this.monitorDecisions(), 1000);
        setInterval(() => this.validatePolicy(), 5000);
        setInterval(() => this.optimizePolicy(), 10000);
        
        // Network updates
        setInterval(() => this.updateTargetNetwork(), 60000);
        setInterval(() => this.pruneGradients(), 300000);
        
        // Model persistence
        setInterval(() => this.saveNetworks(), 24 * 60 * 60 * 1000);
    }
}

module.exports = { PolicyNetwork }; 