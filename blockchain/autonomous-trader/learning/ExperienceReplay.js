const tf = require('@tensorflow/tfjs-node');
const EventEmitter = require('events');

class ExperienceReplay extends EventEmitter {
    constructor() {
        super();
        
        // Advanced components for experience replay
        this.components = {
            memoryBuffer: this.initializeMemoryBuffer(),
            priorityManager: this.initializePriorityManager(),
            samplingStrategy: this.initializeSamplingStrategy(),
            rewardScaler: this.initializeRewardScaler(),
            experienceEvaluator: this.initializeExperienceEvaluator()
        };

        // Experience replay configuration
        this.config = {
            memory: {
                capacity: 1000000,     // Maximum memory buffer size
                minSize: 1000,         // Minimum experiences before training
                batchSize: 32,         // Batch size for sampling
                priorityAlpha: 0.6,    // Priority exponent
                importanceBeta: 0.4    // Importance sampling factor
            },
            priorities: {
                maxPriority: 1.0,      // Maximum priority value
                minPriority: 0.01,     // Minimum priority value
                decayFactor: 0.99,     // Priority decay rate
                boostFactor: 1.5      // Priority boost for rare experiences
            },
            sampling: {
                strategies: {
                    prioritized: 0.7,   // Prioritized sampling probability
                    uniform: 0.2,       // Uniform sampling probability
                    recent: 0.1        // Recent experience sampling probability
                },
                temperature: 0.5,      // Temperature for softmax sampling
                recencyBias: 0.3      // Bias towards recent experiences
            },
            optimization: {
                updateFrequency: 100,  // Priority update frequency
                cleanupFrequency: 1000, // Memory cleanup frequency
                evaluationFrequency: 500 // Experience evaluation frequency
            }
        };

        // Initialize state
        this.experiences = [];
        this.priorities = [];
        this.timestamps = [];
        this.metrics = {
            totalExperiences: 0,
            sampledExperiences: 0,
            averagePriority: 0,
            memoryUtilization: 0
        };

        // Start experience replay system
        this.startExperienceReplay();
    }

    add(experience) {
        const priority = this.calculatePriority(experience);
        const timestamp = Date.now();

        if (this.experiences.length >= this.config.memory.capacity) {
            this.removeLowestPriorityExperience();
        }

        this.experiences.push(experience);
        this.priorities.push(priority);
        this.timestamps.push(timestamp);

        this.metrics.totalExperiences++;
        this.updateMemoryMetrics();
        
        // Emit experience added event
        this.emit('experienceAdded', { experience, priority, timestamp });
    }

    sample(batchSize = this.config.memory.batchSize) {
        if (this.experiences.length < this.config.memory.minSize) {
            return null;
        }

        const strategy = this.selectSamplingStrategy();
        const indices = this.sampleIndices(batchSize, strategy);
        const experiences = indices.map(i => this.experiences[i]);
        const weights = this.calculateImportanceWeights(indices);

        this.metrics.sampledExperiences += batchSize;
        
        // Update priorities after sampling
        this.updatePriorities(indices);

        return {
            experiences,
            indices,
            weights
        };
    }

    calculatePriority(experience) {
        const basePriority = this.components.priorityManager.calculateBasePriority(experience);
        const rewardFactor = this.components.rewardScaler.scaleReward(experience.reward);
        const rarityBoost = this.calculateRarityBoost(experience);

        return Math.min(
            this.config.priorities.maxPriority,
            Math.max(
                this.config.priorities.minPriority,
                basePriority * rewardFactor * rarityBoost
            )
        );
    }

    calculateRarityBoost(experience) {
        const similarExperiences = this.findSimilarExperiences(experience);
        const rarityScore = 1 - (similarExperiences.length / this.experiences.length);
        return 1 + (rarityScore * this.config.priorities.boostFactor);
    }

    findSimilarExperiences(experience) {
        return this.experiences.filter(exp => 
            this.components.experienceEvaluator.calculateSimilarity(exp, experience) > 0.8
        );
    }

    sampleIndices(batchSize, strategy) {
        switch (strategy) {
            case 'prioritized':
                return this.prioritizedSampling(batchSize);
            case 'uniform':
                return this.uniformSampling(batchSize);
            case 'recent':
                return this.recentSampling(batchSize);
            default:
                return this.prioritizedSampling(batchSize);
        }
    }

    prioritizedSampling(batchSize) {
        const probabilities = this.calculateSamplingProbabilities();
        return this.stochasticSampling(probabilities, batchSize);
    }

    calculateSamplingProbabilities() {
        const sum = this.priorities.reduce((a, b) => a + Math.pow(b, this.config.memory.priorityAlpha), 0);
        return this.priorities.map(p => Math.pow(p, this.config.memory.priorityAlpha) / sum);
    }

    stochasticSampling(probabilities, batchSize) {
        const indices = [];
        const probs = [...probabilities];
        
        for (let i = 0; i < batchSize; i++) {
            const sum = probs.reduce((a, b) => a + b, 0);
            let rand = Math.random() * sum;
            
            for (let j = 0; j < probs.length; j++) {
                rand -= probs[j];
                if (rand <= 0) {
                    indices.push(j);
                    probs[j] = 0; // Prevent resampling
                    break;
                }
            }
        }

        return indices;
    }

    calculateImportanceWeights(indices) {
        const N = this.experiences.length;
        const probabilities = this.calculateSamplingProbabilities();
        
        return indices.map(i => {
            const prob = probabilities[i];
            return Math.pow(1 / (N * prob), this.config.memory.importanceBeta);
        });
    }

    updatePriorities(indices) {
        indices.forEach(i => {
            this.priorities[i] *= this.config.priorities.decayFactor;
            this.evaluateAndAdjustPriority(i);
        });

        this.metrics.averagePriority = this.calculateAveragePriority();
    }

    evaluateAndAdjustPriority(index) {
        const experience = this.experiences[index];
        const evaluation = this.components.experienceEvaluator.evaluate(experience);
        
        if (evaluation.isValuable) {
            this.priorities[index] *= this.config.priorities.boostFactor;
        }
    }

    removeLowestPriorityExperience() {
        const minPriorityIndex = this.priorities.indexOf(Math.min(...this.priorities));
        
        this.experiences.splice(minPriorityIndex, 1);
        this.priorities.splice(minPriorityIndex, 1);
        this.timestamps.splice(minPriorityIndex, 1);
    }

    updateMemoryMetrics() {
        this.metrics.memoryUtilization = this.experiences.length / this.config.memory.capacity;
        this.metrics.averagePriority = this.calculateAveragePriority();
    }

    calculateAveragePriority() {
        return this.priorities.reduce((a, b) => a + b, 0) / this.priorities.length;
    }

    startExperienceReplay() {
        // Regular maintenance and optimization
        setInterval(() => this.updatePriorities(Array.from(Array(this.experiences.length).keys())), 
            this.config.optimization.updateFrequency);
        
        setInterval(() => this.cleanupMemory(), 
            this.config.optimization.cleanupFrequency);
        
        setInterval(() => this.evaluateExperiences(), 
            this.config.optimization.evaluationFrequency);
        
        // Metrics tracking
        setInterval(() => this.updateMemoryMetrics(), 5000);
        
        // Event handling
        this.on('experienceAdded', this.handleNewExperience.bind(this));
    }
}

module.exports = { ExperienceReplay }; 