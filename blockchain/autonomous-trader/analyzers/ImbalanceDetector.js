const tf = require('@tensorflow/tfjs-node');
const EventEmitter = require('events');

class ImbalanceDetector extends EventEmitter {
    constructor() {
        super();
        
        // Advanced AI models for imbalance detection
        this.models = {
            imbalancePredictor: this.initializeImbalanceModel(),
            orderBookAnalyzer: this.initializeOrderBookModel(),
            depthAnalyzer: this.initializeDepthModel(),
            spreadAnalyzer: this.initializeSpreadModel(),
            liquidityAnalyzer: this.initializeLiquidityModel()
        };

        // Imbalance detection configuration
        this.config = {
            imbalanceMetrics: {
                severity: {
                    critical: 0.9,    // 90%+ imbalance
                    severe: 0.7,      // 70%+ imbalance
                    significant: 0.5, // 50%+ imbalance
                    moderate: 0.3    // 30%+ imbalance
                },
                orderBook: {
                    depth: {
                        deep: 1000000,    // $1M+ depth
                        moderate: 500000,  // $500k+ depth
                        shallow: 100000   // $100k+ depth
                    },
                    spread: {
                        wide: 0.01,       // 1%+ spread
                        normal: 0.005,    // 0.5%+ spread
                        tight: 0.001     // 0.1%+ spread
                    }
                },
                liquidity: {
                    high: 0.8,        // 80%+ liquidity
                    moderate: 0.5,    // 50%+ liquidity
                    low: 0.2         // 20%+ liquidity
                }
            },
            analysis: {
                timeframes: {
                    instant: 1,       // 1 minute
                    quick: 5,         // 5 minutes
                    short: 15,        // 15 minutes
                    medium: 60       // 1 hour
                },
                thresholds: {
                    minImbalance: 0.4,    // Minimum 40% imbalance
                    minDepth: 100000,     // Minimum $100k depth
                    minLiquidity: 0.3     // Minimum 30% liquidity
                }
            }
        };

        // Initialize components
        this.imbalanceTracker = new ImbalanceTracker();
        this.orderBookMonitor = new OrderBookMonitor();
        this.liquidityTracker = new LiquidityTracker();
        
        // Start imbalance detection
        this.startImbalanceDetection();
    }

    async detectImbalance(marketData) {
        console.log(`⚖️ Detecting Market Imbalance...`);

        try {
            // Generate comprehensive imbalance analysis
            const analysis = await this.generateImbalanceAnalysis(marketData);
            
            // Calculate imbalance components
            const components = await this.calculateImbalanceComponents(analysis);
            
            // Return imbalance evaluation
            return this.generateImbalanceEvaluation(components);

        } catch (error) {
            console.error('❌ Imbalance Detection Error:', error.message);
            this.handleDetectionError(error);
        }
    }

    async generateImbalanceAnalysis(marketData) {
        const features = this.prepareImbalanceFeatures(marketData);
        const predictions = await this.models.imbalancePredictor.predict(features).data();

        return {
            severity: this.calculateImbalanceSeverity(predictions),
            orderBook: await this.analyzeOrderBook(marketData),
            depth: await this.analyzeMarketDepth(marketData),
            spread: await this.analyzeSpread(marketData),
            liquidity: await this.analyzeLiquidity(marketData)
        };
    }

    async analyzeOrderBook(marketData) {
        const features = this.prepareOrderBookFeatures(marketData);
        const orderBook = await this.models.orderBookAnalyzer.predict(features).data();

        return {
            buyDepth: this.calculateBuyDepth(orderBook),
            sellDepth: this.calculateSellDepth(orderBook),
            ratio: this.calculateDepthRatio(orderBook),
            concentration: this.analyzeOrderConcentration(orderBook)
        };
    }

    async analyzeMarketDepth(marketData) {
        const features = this.prepareDepthFeatures(marketData);
        const depth = await this.models.depthAnalyzer.predict(features).data();

        return {
            totalDepth: this.calculateTotalDepth(depth),
            distribution: this.analyzeDepthDistribution(depth),
            quality: this.assessDepthQuality(depth),
            stability: this.analyzeDepthStability(depth)
        };
    }

    calculateImbalanceSeverity(predictions) {
        const metrics = {
            orderBookRatio: predictions.orderBookRatio,
            depthImbalance: predictions.depthImbalance,
            liquiditySkew: predictions.liquiditySkew
        };

        return {
            level: this.determineImbalanceLevel(metrics),
            score: this.calculateImbalanceScore(metrics),
            trend: this.analyzeImbalanceTrend(predictions),
            confidence: this.calculateImbalanceConfidence(metrics)
        };
    }

    async generateImbalanceEvaluation(components) {
        if (!this.meetsImbalanceThresholds(components)) {
            return null;
        }

        const imbalanceSignal = await this.generateImbalanceSignal(components);
        const tradingImplications = this.calculateTradingImplications(components);

        return {
            type: 'IMBALANCE_DETECTION',
            signal: imbalanceSignal,
            implications: tradingImplications,
            components: components,
            confidence: this.calculateOverallConfidence(components),
            recommendation: this.generateTradeRecommendation(imbalanceSignal, tradingImplications),
            warnings: this.generateImbalanceWarnings(components),
            timestamp: Date.now()
        };
    }

    generateImbalanceSignal(components) {
        return {
            severity: this.calculateSignalSeverity(components),
            direction: this.determineImbalanceDirection(components),
            timeframe: this.determineSignalTimeframe(components),
            significance: this.calculateSignalSignificance(components)
        };
    }

    meetsImbalanceThresholds(components) {
        return (
            components.severity.score >= this.config.analysis.thresholds.minImbalance &&
            components.depth.totalDepth >= this.config.analysis.thresholds.minDepth &&
            components.liquidity.level >= this.config.analysis.thresholds.minLiquidity
        );
    }

    async initializeImbalanceModel() {
        const model = tf.sequential();
        
        // Sophisticated neural network for imbalance prediction
        model.add(tf.layers.dense({
            units: 256,
            activation: 'relu',
            inputShape: [20],
            kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 })
        }));
        
        model.add(tf.layers.dropout(0.3));
        
        model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 })
        }));

        model.compile({
            optimizer: tf.train.adamax(0.0001),
            loss: 'huberLoss',
            metrics: ['accuracy', 'precision', 'recall']
        });

        return model;
    }

    startImbalanceDetection() {
        // Real-time imbalance monitoring
        setInterval(() => this.monitorImbalance(), 1000);
        setInterval(() => this.trackOrderBook(), 5000);
        setInterval(() => this.analyzeLiquidity(), 10000);
        
        // Analysis validation and evolution
        setInterval(() => this.validateAnalysis(), 60000);
        setInterval(() => this.trackAnalysisAccuracy(), 300000);
        
        // Model retraining
        setInterval(() => this.retrainModels(), 24 * 60 * 60 * 1000);
    }
}

module.exports = { ImbalanceDetector }; 