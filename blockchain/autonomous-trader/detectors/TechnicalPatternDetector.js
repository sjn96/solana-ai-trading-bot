const tf = require('@tensorflow/tfjs-node');

class TechnicalPatternDetector {
    constructor() {
        // Initialize AI models for pattern recognition
        this.models = {
            breakout: this.initializeBreakoutModel(),
            reversal: this.initializeReversalModel(),
            continuation: this.initializeContinuationModel()
        };

        // Pattern configurations
        this.config = {
            minPatternBars: 5,
            confirmationBars: 3,
            volumeThreshold: 1.5,
            breakoutThreshold: 0.02,
            trendStrengthThreshold: 0.7
        };

        // Initialize pattern memory
        this.patternMemory = new Map();
    }

    async isBreakout(data) {
        console.log('🔍 Analyzing Breakout Pattern...');

        try {
            // Prepare features for breakout analysis
            const features = await this.prepareBreakoutFeatures(data);
            
            // Get AI prediction
            const prediction = await this.models.breakout.predict(features).data();
            
            // Validate breakout conditions
            if (prediction[0] > this.config.trendStrengthThreshold) {
                return await this.validateBreakout(data, prediction[0]);
            }

            return false;

        } catch (error) {
            console.error('❌ Breakout Detection Error:', error.message);
            return false;
        }
    }

    async validateBreakout(data, confidence) {
        // Check volume confirmation
        const volumeConfirmed = this.checkVolumeConfirmation(data);
        
        // Check price action confirmation
        const priceConfirmed = this.checkPriceConfirmation(data);
        
        // Check support/resistance levels
        const levelBreak = this.checkLevelBreak(data);

        return {
            isValid: volumeConfirmed && priceConfirmed && levelBreak,
            confidence,
            confirmations: {
                volume: volumeConfirmed,
                price: priceConfirmed,
                level: levelBreak
            }
        };
    }

    async isReversal(data) {
        console.log('🔄 Analyzing Reversal Pattern...');

        try {
            // Prepare reversal features
            const features = await this.prepareReversalFeatures(data);
            
            // Get AI prediction
            const prediction = await this.models.reversal.predict(features).data();
            
            // Validate reversal conditions
            if (prediction[0] > this.config.trendStrengthThreshold) {
                return await this.validateReversal(data, prediction[0]);
            }

            return false;

        } catch (error) {
            console.error('❌ Reversal Detection Error:', error.message);
            return false;
        }
    }

    async isContinuation(data) {
        console.log('➡️ Analyzing Continuation Pattern...');

        try {
            // Prepare continuation features
            const features = await this.prepareContinuationFeatures(data);
            
            // Get AI prediction
            const prediction = await this.models.continuation.predict(features).data();
            
            // Validate continuation conditions
            if (prediction[0] > this.config.trendStrengthThreshold) {
                return await this.validateContinuation(data, prediction[0]);
            }

            return false;

        } catch (error) {
            console.error('❌ Continuation Detection Error:', error.message);
            return false;
        }
    }

    async prepareBreakoutFeatures(data) {
        // Calculate technical indicators
        const indicators = await Promise.all([
            this.calculateRSI(data),
            this.calculateMACD(data),
            this.calculateBollingerBands(data),
            this.calculateVolumeTrend(data),
            this.calculatePriceChannels(data)
        ]);

        // Combine indicators into feature tensor
        return tf.tensor2d([this.normalizeFeatures(indicators)]);
    }

    calculateRSI(data, period = 14) {
        let gains = 0;
        let losses = 0;

        // Calculate initial RSI
        for (let i = 1; i < period + 1; i++) {
            const difference = data.prices[i] - data.prices[i - 1];
            if (difference >= 0) {
                gains += difference;
            } else {
                losses -= difference;
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(data) {
        const ema12 = this.calculateEMA(data.prices, 12);
        const ema26 = this.calculateEMA(data.prices, 26);
        const macd = ema12 - ema26;
        const signal = this.calculateEMA([macd], 9);

        return {
            macd,
            signal,
            histogram: macd - signal
        };
    }

    calculateBollingerBands(data, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(data.prices, period);
        const standardDeviation = this.calculateStandardDeviation(data.prices, period);

        return {
            upper: sma + (stdDev * standardDeviation),
            middle: sma,
            lower: sma - (stdDev * standardDeviation)
        };
    }

    async initializeBreakoutModel() {
        const model = tf.sequential();
        
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            inputShape: [15]  // Technical indicators features
        }));
        
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }
}

module.exports = { TechnicalPatternDetector }; 