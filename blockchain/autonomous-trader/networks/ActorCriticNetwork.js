const tf = require('@tensorflow/tfjs-node');
const EventEmitter = require('events');

class ActorCriticNetwork extends EventEmitter {
    constructor() {
        super();
        
        // Advanced network components
        this.networks = {
            actor: this.buildActorNetwork(),
            critic: this.buildCriticNetwork(),
            targetActor: this.buildActorNetwork(),
            targetCritic: this.buildCriticNetwork()
        };

        // Network configuration
        this.config = {
            architecture: {
                shared: {
                    inputShape: [128],      // State dimension
                    encoding: [256, 512, 256], // Shared encoding layers
                    activation: 'relu',
                    batchNorm: true,
                    dropout: 0.2
                },
                actor: {
                    hidden: [256, 128],     // Actor-specific layers
                    outputSize: 3,          // Buy, sell, hold
                    finalActivation: 'softmax'
                },
                critic: {
                    hidden: [256, 128],     // Critic-specific layers
                    outputSize: 1,          // Value estimation
                    finalActivation: 'linear'
                }
            },
            training: {
                actorLR: 0.0001,
                criticLR: 0.001,
                batchSize: 64,
                targetUpdate: {
                    frequency: 1000,        // Update frequency in steps
                    tau: 0.001             // Soft update parameter
                },
                gradientClip: 0.5,
                optimizer: {
                    type: 'adam',
                    beta1: 0.9,
                    beta2: 0.999,
                    epsilon: 1e-8
                }
            },
            regularization: {
                l2: 0.01,                  // L2 regularization
                entropyBeta: 0.01,         // Entropy regularization
                maxGradNorm: 0.5          // Gradient norm clipping
            }
        };

        // Initialize optimizers
        this.optimizers = {
            actor: this.initializeOptimizer(this.config.training.actorLR),
            critic: this.initializeOptimizer(this.config.training.criticLR)
        };

        // Start network management
        this.startNetworkManagement();
    }

    buildActorNetwork() {
        const model = tf.sequential();
        
        // Shared encoding layers
        this.config.architecture.shared.encoding.forEach((units, index) => {
            if (index === 0) {
                model.add(tf.layers.dense({
                    units,
                    inputShape: this.config.architecture.shared.inputShape,
                    activation: this.config.architecture.shared.activation,
                    kernelRegularizer: tf.regularizers.l2({
                        l2: this.config.regularization.l2
                    })
                }));
            } else {
                model.add(tf.layers.dense({
                    units,
                    activation: this.config.architecture.shared.activation,
                    kernelRegularizer: tf.regularizers.l2({
                        l2: this.config.regularization.l2
                    })
                }));
            }

            if (this.config.architecture.shared.batchNorm) {
                model.add(tf.layers.batchNormalization());
            }

            if (this.config.architecture.shared.dropout > 0) {
                model.add(tf.layers.dropout({
                    rate: this.config.architecture.shared.dropout
                }));
            }
        });

        // Actor-specific layers
        this.config.architecture.actor.hidden.forEach(units => {
            model.add(tf.layers.dense({
                units,
                activation: this.config.architecture.shared.activation,
                kernelRegularizer: tf.regularizers.l2({
                    l2: this.config.regularization.l2
                })
            }));
        });

        // Output layer
        model.add(tf.layers.dense({
            units: this.config.architecture.actor.outputSize,
            activation: this.config.architecture.actor.finalActivation
        }));

        return model;
    }

    buildCriticNetwork() {
        const model = tf.sequential();
        
        // Shared encoding layers (similar to actor)
        this.config.architecture.shared.encoding.forEach((units, index) => {
            if (index === 0) {
                model.add(tf.layers.dense({
                    units,
                    inputShape: this.config.architecture.shared.inputShape,
                    activation: this.config.architecture.shared.activation,
                    kernelRegularizer: tf.regularizers.l2({
                        l2: this.config.regularization.l2
                    })
                }));
            } else {
                model.add(tf.layers.dense({
                    units,
                    activation: this.config.architecture.shared.activation,
                    kernelRegularizer: tf.regularizers.l2({
                        l2: this.config.regularization.l2
                    })
                }));
            }

            if (this.config.architecture.shared.batchNorm) {
                model.add(tf.layers.batchNormalization());
            }
        });

        // Critic-specific layers
        this.config.architecture.critic.hidden.forEach(units => {
            model.add(tf.layers.dense({
                units,
                activation: this.config.architecture.shared.activation,
                kernelRegularizer: tf.regularizers.l2({
                    l2: this.config.regularization.l2
                })
            }));
        });

        // Output layer
        model.add(tf.layers.dense({
            units: this.config.architecture.critic.outputSize,
            activation: this.config.architecture.critic.finalActivation
        }));

        return model;
    }

    async update(states, actions, advantages, returns) {
        console.log(`🔄 Updating Actor-Critic Networks...`);

        try {
            // Update actor network
            const actorLoss = await this.updateActor(states, actions, advantages);
            
            // Update critic network
            const criticLoss = await this.updateCritic(states, returns);
            
            // Update target networks if needed
            if (this.shouldUpdateTargets()) {
                await this.updateTargetNetworks();
            }
            
            return {
                actorLoss,
                criticLoss
            };

        } catch (error) {
            console.error('❌ Network Update Error:', error.message);
            this.handleUpdateError(error);
        }
    }

    async updateActor(states, actions, advantages) {
        return tf.tidy(() => {
            const stateTensor = tf.tensor2d(states);
            const actionTensor = tf.tensor1d(actions, 'int32');
            const advantageTensor = tf.tensor1d(advantages);

            // Forward pass
            const predictions = this.networks.actor.predict(stateTensor);
            
            // Calculate policy loss with entropy regularization
            const negLogProb = tf.losses.softmaxCrossEntropy(
                actionTensor,
                predictions
            );
            const entropy = this.calculateEntropy(predictions);
            const policyLoss = tf.mean(tf.mul(negLogProb, advantageTensor))
                .sub(tf.mul(entropy, tf.scalar(this.config.regularization.entropyBeta)));

            return this.optimizers.actor.minimize(
                () => policyLoss,
                true,
                this.networks.actor.trainableWeights
            );
        });
    }

    async updateCritic(states, returns) {
        return tf.tidy(() => {
            const stateTensor = tf.tensor2d(states);
            const returnTensor = tf.tensor1d(returns);

            // Forward pass
            const predictions = this.networks.critic.predict(stateTensor);
            
            // Calculate value loss
            const valueLoss = tf.losses.meanSquaredError(returnTensor, predictions);

            return this.optimizers.critic.minimize(
                () => valueLoss,
                true,
                this.networks.critic.trainableWeights
            );
        });
    }

    async updateTargetNetworks() {
        // Soft update target networks
        const tau = this.config.training.targetUpdate.tau;
        
        for (let i = 0; i < this.networks.actor.weights.length; i++) {
            const weight = this.networks.actor.weights[i];
            const targetWeight = this.networks.targetActor.weights[i];
            const updatedWeight = weight.mul(tau).add(targetWeight.mul(1 - tau));
            this.networks.targetActor.weights[i].assign(updatedWeight);
        }
        
        for (let i = 0; i < this.networks.critic.weights.length; i++) {
            const weight = this.networks.critic.weights[i];
            const targetWeight = this.networks.targetCritic.weights[i];
            const updatedWeight = weight.mul(tau).add(targetWeight.mul(1 - tau));
            this.networks.targetCritic.weights[i].assign(updatedWeight);
        }
    }

    calculateEntropy(predictions) {
        return tf.tidy(() => {
            const logProbs = tf.log(predictions);
            return tf.mean(tf.sum(tf.mul(predictions, logProbs), -1));
        });
    }

    startNetworkManagement() {
        // Real-time network monitoring
        setInterval(() => this.monitorNetworks(), 1000);
        setInterval(() => this.validateNetworks(), 5000);
        setInterval(() => this.optimizeNetworks(), 10000);
        
        // Network maintenance
        setInterval(() => this.updateTargetNetworks(), 60000);
        setInterval(() => this.pruneGradients(), 300000);
        
        // Model persistence
        setInterval(() => this.saveNetworks(), 24 * 60 * 60 * 1000);
    }
}

module.exports = { ActorCriticNetwork }; 