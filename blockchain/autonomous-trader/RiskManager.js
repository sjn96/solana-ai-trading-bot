const EventEmitter = require('events');

class RiskManager extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            maxDrawdown: config.maxDrawdown || 0.15,
            maxPositionSize: config.maxPositionSize || 0.1,
            defaultStopLoss: config.defaultStopLoss || 0.05,
            trailingStopDistance: config.trailingStopDistance || 0.02,
            maxDailyLoss: config.maxDailyLoss || 0.05,
            volatilityMultiplier: config.volatilityMultiplier || 1.5
        };

        // Dynamic risk parameters
        this.riskParameters = {
            currentDrawdown: 0,
            dailyLoss: 0,
            successRate: 0,
            volatilityAdjustment: 1,
            riskAdjustment: 1
        };

        // Performance tracking
        this.performanceMetrics = {
            totalTrades: 0,
            successfulTrades: 0,
            averageReturn: 0,
            maxDrawdown: 0
        };

        // Initialize AI risk model
        this.riskModel = this.initializeRiskModel();
    }

    async initializeRiskModel() {
        // Initialize TensorFlow model for risk prediction
        const model = tf.sequential();
        
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu',
            inputShape: [10]
        }));
        
        model.add(tf.layers.dense({
            units: 16,
            activation: 'relu'
        }));
        
        model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    async calculatePositionSize(decision, marketData) {
        console.log('🎯 Calculating Optimal Position Size...');

        try {
            // Get AI risk prediction
            const riskScore = await this.predictRisk(decision, marketData);
            
            // Calculate base position size
            let positionSize = this.config.maxPositionSize;

            // Apply risk adjustments
            positionSize *= this.calculateRiskMultiplier(riskScore);
            positionSize *= this.calculateVolatilityAdjustment(marketData);
            positionSize *= this.calculatePerformanceAdjustment();

            // Apply maximum limits
            positionSize = Math.min(
                positionSize,
                this.config.maxPositionSize,
                this.calculateMaxPositionFromDrawdown()
            );

            return positionSize;

        } catch (error) {
            console.error('❌ Position Size Calculation Error:', error.message);
            return this.config.maxPositionSize * 0.5; // Conservative fallback
        }
    }

    async calculateAdaptiveStopLoss(decision, marketData) {
        console.log('🛡️ Calculating Adaptive Stop-Loss...');

        try {
            // Base stop-loss calculation
            let stopLoss = this.config.defaultStopLoss;

            // Adjust for volatility
            const volatility = this.calculateVolatility(marketData);
            stopLoss *= (1 + volatility * this.config.volatilityMultiplier);

            // Adjust for risk score
            const riskScore = await this.predictRisk(decision, marketData);
            stopLoss *= (1 + riskScore);

            // Adjust for performance
            stopLoss *= this.calculatePerformanceAdjustment();

            // Apply trailing stop if conditions met
            const trailingStop = this.calculateTrailingStop(marketData);

            return {
                initialStop: stopLoss,
                trailingStop: trailingStop,
                isTrailing: trailingStop !== null
            };

        } catch (error) {
            console.error('❌ Stop-Loss Calculation Error:', error.message);
            return {
                initialStop: this.config.defaultStopLoss,
                trailingStop: null,
                isTrailing: false
            };
        }
    }

    async predictRisk(decision, marketData) {
        // Prepare features for risk prediction
        const features = this.prepareRiskFeatures(decision, marketData);
        
        // Get prediction from AI model
        const prediction = await this.riskModel.predict(features).data();
        
        return prediction[0];
    }

    calculateRiskMultiplier(riskScore) {
        return Math.max(0.1, 1 - riskScore);
    }

    calculateVolatilityAdjustment(marketData) {
        const volatility = this.calculateVolatility(marketData);
        return Math.max(0.5, 1 - (volatility * this.config.volatilityMultiplier));
    }

    calculatePerformanceAdjustment() {
        return Math.min(1.5, Math.max(0.5,
            1 + (this.performanceMetrics.successRate - 0.5)
        ));
    }

    calculateMaxPositionFromDrawdown() {
        const remainingRisk = this.config.maxDrawdown - this.riskParameters.currentDrawdown;
        return Math.max(0, this.config.maxPositionSize * (remainingRisk / this.config.maxDrawdown));
    }

    updatePerformance(tradeResult) {
        // Update performance metrics
        this.performanceMetrics.totalTrades++;
        if (tradeResult.profit > 0) {
            this.performanceMetrics.successfulTrades++;
        }

        // Update success rate
        this.performanceMetrics.successRate = 
            this.performanceMetrics.successfulTrades / 
            this.performanceMetrics.totalTrades;

        // Update average return
        this.performanceMetrics.averageReturn = 
            (this.performanceMetrics.averageReturn * (this.performanceMetrics.totalTrades - 1) +
            tradeResult.profit) / this.performanceMetrics.totalTrades;

        // Update drawdown
        this.updateDrawdown(tradeResult);

        // Emit performance update event
        this.emit('performanceUpdate', this.performanceMetrics);
    }

    updateDrawdown(tradeResult) {
        if (tradeResult.profit < 0) {
            this.riskParameters.currentDrawdown += Math.abs(tradeResult.profit);
            this.riskParameters.dailyLoss += Math.abs(tradeResult.profit);

            // Check for risk limits
            if (this.riskParameters.currentDrawdown > this.config.maxDrawdown ||
                this.riskParameters.dailyLoss > this.config.maxDailyLoss) {
                this.emit('riskLimitReached', {
                    currentDrawdown: this.riskParameters.currentDrawdown,
                    dailyLoss: this.riskParameters.dailyLoss
                });
            }
        }
    }

    resetDailyMetrics() {
        this.riskParameters.dailyLoss = 0;
    }
}

module.exports = { RiskManager }; 