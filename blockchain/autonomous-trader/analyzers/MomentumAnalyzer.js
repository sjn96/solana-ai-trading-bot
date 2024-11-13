const tf = require('@tensorflow/tfjs-node');
const EventEmitter = require('events');

class MomentumAnalyzer extends EventEmitter {
    constructor() {
        super();
        
        // Advanced momentum components
        this.indicators = {
            rsi: this.initializeRSI(),
            macd: this.initializeMACD(),
            adx: this.initializeADX(),
            bb: this.initializeBollingerBands(),
            stoch: this.initializeStochastic(),
            obv: this.initializeOBV()
        };

        // Momentum analysis configuration
        this.config = {
            rsi: {
                period: 14,
                overbought: 70,
                oversold: 30,
                weight: 0.2
            },
            macd: {
                fast: 12,
                slow: 26,
                signal: 9,
                weight: 0.2
            },
            adx: {
                period: 14,
                threshold: 25,
                strong: 50,
                weight: 0.15
            },
            bollingerBands: {
                period: 20,
                stdDev: 2,
                weight: 0.15
            },
            stochastic: {
                k: 14,
                d: 3,
                overbought: 80,
                oversold: 20,
                weight: 0.15
            },
            obv: {
                period: 20,
                threshold: 0.5,
                weight: 0.15
            },
            combination: {
                timeframes: {
                    micro: 1,           // 1-minute
                    short: 5,           // 5-minute
                    medium: 15,         // 15-minute
                    long: 60           // 1-hour
                },
                weights: {
                    micro: 0.4,
                    short: 0.3,
                    medium: 0.2,
                    long: 0.1
                }
            }
        };

        // Initialize momentum state
        this.momentumState = {
            current: new Map(),
            history: new Map(),
            signals: new Map(),
            strength: new Map()
        };

        // Start momentum analysis
        this.startMomentumAnalysis();
    }

    async analyzeMomentum(marketData) {
        console.log(`📈 Analyzing Momentum...`);

        try {
            // Calculate all momentum indicators
            const indicators = await this.calculateIndicators(marketData);
            
            // Generate momentum signals
            const signals = this.generateMomentumSignals(indicators);
            
            // Calculate momentum strength
            const strength = this.calculateMomentumStrength(indicators);
            
            // Combine analyses
            const analysis = this.combineMomentumAnalyses({
                indicators,
                signals,
                strength
            });
            
            // Update momentum state
            this.updateMomentumState(analysis);
            
            return analysis;

        } catch (error) {
            console.error('❌ Momentum Analysis Error:', error.message);
            this.handleAnalysisError(error);
        }
    }

    async calculateIndicators(marketData) {
        const timeframes = this.config.combination.timeframes;
        const indicators = {};

        // Calculate indicators for each timeframe
        for (const [frame, period] of Object.entries(timeframes)) {
            indicators[frame] = {
                rsi: await this.calculateRSI(marketData, period),
                macd: await this.calculateMACD(marketData, period),
                adx: await this.calculateADX(marketData, period),
                bb: await this.calculateBollingerBands(marketData, period),
                stoch: await this.calculateStochastic(marketData, period),
                obv: await this.calculateOBV(marketData, period)
            };
        }

        return indicators;
    }

    async calculateRSI(marketData, period) {
        const prices = this.getPrices(marketData, period);
        const changes = this.calculatePriceChanges(prices);
        
        // Calculate gains and losses
        const gains = changes.map(change => Math.max(change, 0));
        const losses = changes.map(change => Math.abs(Math.min(change, 0)));
        
        // Calculate average gains and losses
        const avgGain = this.calculateEMA(gains, this.config.rsi.period);
        const avgLoss = this.calculateEMA(losses, this.config.rsi.period);
        
        // Calculate RSI
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return {
            value: rsi,
            signal: this.generateRSISignal(rsi),
            strength: this.calculateRSIStrength(rsi)
        };
    }

    async calculateMACD(marketData, period) {
        const prices = this.getPrices(marketData, period);
        
        // Calculate EMAs
        const fastEMA = this.calculateEMA(prices, this.config.macd.fast);
        const slowEMA = this.calculateEMA(prices, this.config.macd.slow);
        
        // Calculate MACD line
        const macdLine = fastEMA - slowEMA;
        
        // Calculate signal line
        const signalLine = this.calculateEMA(
            [macdLine],
            this.config.macd.signal
        );
        
        // Calculate histogram
        const histogram = macdLine - signalLine;
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram,
            indication: this.generateMACDSignal(macdLine, signalLine, histogram),
            strength: this.calculateMACDStrength(histogram)
        };
    }

    async calculateBollingerBands(marketData, period) {
        const prices = this.getPrices(marketData, period);
        
        // Calculate middle band (SMA)
        const middleBand = this.calculateSMA(prices, this.config.bollingerBands.period);
        
        // Calculate standard deviation
        const stdDev = this.calculateStandardDeviation(
            prices,
            this.config.bollingerBands.period
        );
        
        // Calculate upper and lower bands
        const upperBand = middleBand + (stdDev * this.config.bollingerBands.stdDev);
        const lowerBand = middleBand - (stdDev * this.config.bollingerBands.stdDev);
        
        return {
            upper: upperBand,
            middle: middleBand,
            lower: lowerBand,
            bandwidth: (upperBand - lowerBand) / middleBand,
            signal: this.generateBBSignal(prices[prices.length - 1], upperBand, lowerBand),
            strength: this.calculateBBStrength(prices[prices.length - 1], upperBand, lowerBand, middleBand)
        };
    }

    generateMomentumSignals(indicators) {
        const signals = {};
        
        // Generate signals for each timeframe
        for (const [frame, frameIndicators] of Object.entries(indicators)) {
            signals[frame] = {
                primary: this.generatePrimarySignal(frameIndicators),
                secondary: this.generateSecondarySignal(frameIndicators),
                confirmation: this.generateConfirmationSignal(frameIndicators)
            };
        }
        
        // Generate combined signal
        return {
            timeframe: signals,
            combined: this.combineTimeframeSignals(signals),
            strength: this.calculateSignalStrength(signals)
        };
    }

    calculateMomentumStrength(indicators) {
        const strengths = {};
        
        // Calculate strength for each timeframe
        for (const [frame, frameIndicators] of Object.entries(indicators)) {
            strengths[frame] = {
                individual: this.calculateIndicatorStrengths(frameIndicators),
                combined: this.calculateCombinedStrength(frameIndicators)
            };
        }
        
        // Calculate overall strength
        return {
            timeframe: strengths,
            overall: this.calculateOverallStrength(strengths),
            confidence: this.calculateStrengthConfidence(strengths)
        };
    }

    updateMomentumState(analysis) {
        // Update current momentum
        this.momentumState.current.set('latest', analysis);
        
        // Store historical data
        this.storeMomentumHistory(analysis);
        
        // Update signals
        this.updateMomentumSignals(analysis);
        
        // Update strength metrics
        this.updateStrengthMetrics(analysis);
    }

    startMomentumAnalysis() {
        // Real-time momentum monitoring
        setInterval(() => this.monitorMomentum(), 1000);
        setInterval(() => this.validateMomentum(), 5000);
        setInterval(() => this.optimizeMomentum(), 10000);
        
        // Analysis maintenance
        setInterval(() => this.updateAnalysis(), 60000);
        setInterval(() => this.pruneHistory(), 300000);
        
        // Analysis persistence
        setInterval(() => this.saveMomentumState(), 24 * 60 * 60 * 1000);
    }
}

module.exports = { MomentumAnalyzer }; 