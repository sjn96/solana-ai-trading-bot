const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');

class OXfunExchange extends EventEmitter {
    constructor() {
        super();
        
        // Advanced exchange components
        this.components = {
            rest: this.initializeRESTClient(),
            websocket: this.initializeWebSocket(),
            leverage: this.initializeLeverageManager(),
            orderbook: this.initializeOrderbookManager()
        };

        // Exchange configuration
        this.config = {
            api: {
                rest: {
                    baseUrl: 'https://api.ox.fun/v1',
                    timeout: 5000,         // Request timeout
                    retries: 3            // Max retries
                },
                ws: {
                    url: 'wss://ws.ox.fun/v1',
                    pingInterval: 15000,   // Keep-alive interval
                    reconnectDelay: 3000  // Reconnection delay
                }
            },
            trading: {
                leverage: {
                    default: 5,            // Default leverage
                    maximum: 50,           // Updated: Maximum leverage to 50x
                    minimum: 1,           // Minimum leverage
                    adaptive: {
                        volatility: {
                            high: 10,      // Max leverage in high volatility
                            medium: 25,    // Max leverage in medium volatility
                            low: 50       // Max leverage in low volatility
                        },
                        confidence: {
                            minimum: 0.7,  // Minimum confidence for max leverage
                            scaling: 0.1  // Leverage scaling factor
                        }
                    }
                },
                limits: {
                    position: 0.2,         // Max position size
                    exposure: 0.5,         // Max total exposure
                    slippage: 0.002       // Max allowed slippage
                }
            },
            risk: {
                stopLoss: {
                    default: 0.05,         // Default stop-loss
                    trailing: true,        // Use trailing stops
                    dynamic: true         // Dynamic adjustment
                },
                takeProfit: {
                    default: 0.1,          // Default take-profit
                    trailing: true,        // Use trailing TP
                    scaling: true         // Scale-out enabled
                }
            },
            monitoring: {
                orderbook: {
                    depth: 20,             // Orderbook depth
                    update: 100,           // Update interval (ms)
                    snapshot: 1000        // Snapshot interval
                },
                funding: {
                    check: 300,            // Check interval (s)
                    threshold: 0.001      // Rate threshold
                }
            }
        };

        // Initialize exchange state
        this.exchangeState = {
            current: new Map(),
            orders: new Map(),
            positions: new Map(),
            orderbook: new Map()
        };

        // Start exchange connection
        this.startExchange();
    }

    async connect() {
        console.log(`🔗 Connecting to OX.fun Exchange...`);

        try {
            // Initialize REST client
            await this.initializeRESTConnection();
            
            // Initialize WebSocket connection
            await this.initializeWSConnection();
            
            // Subscribe to market data
            await this.subscribeToMarketData();
            
            // Initialize order tracking
            await this.initializeOrderTracking();
            
            return true;

        } catch (error) {
            console.error('❌ Exchange Connection Error:', error.message);
            this.handleConnectionError(error);
            return false;
        }
    }

    async executeTrade(order) {
        console.log(`📊 Executing Trade on OX.fun...`);

        try {
            // Validate order parameters
            this.validateOrderParameters(order);
            
            // Calculate position size with leverage
            const position = this.calculateLeveragedPosition(order);
            
            // Check risk parameters
            await this.checkRiskParameters(position);
            
            // Place the order
            const result = await this.placeOrder({
                ...order,
                position,
                leverage: this.calculateOptimalLeverage(position)
            });
            
            // Update order tracking
            this.updateOrderTracking(result);
            
            return result;

        } catch (error) {
            console.error('❌ Trade Execution Error:', error.message);
            this.handleTradeError(error);
            throw error;
        }
    }

    calculateLeveragedPosition(order) {
        const { size, leverage } = order;
        const { maximum, minimum } = this.config.trading.leverage;
        
        // Calculate base position size
        let position = size * leverage;
        
        // Apply leverage limits
        position = Math.min(position, size * maximum);
        position = Math.max(position, size * minimum);
        
        // Apply risk limits
        position = this.applyRiskLimits(position);
        
        return position;
    }

    async monitorPosition(position) {
        // Monitor liquidation risk
        this.monitorLiquidationRisk(position);
        
        // Monitor funding rates
        this.monitorFundingRates(position);
        
        // Update stop-loss
        this.updateDynamicStopLoss(position);
        
        // Update take-profit
        this.updateDynamicTakeProfit(position);
    }

    handleWebSocketMessage(message) {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'orderbook':
                this.handleOrderbookUpdate(data);
                break;
            case 'trade':
                this.handleTradeUpdate(data);
                break;
            case 'position':
                this.handlePositionUpdate(data);
                break;
            case 'funding':
                this.handleFundingUpdate(data);
                break;
            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    }

    updateExchangeState(update) {
        // Update current state
        this.exchangeState.current.set(update.timestamp, update);
        
        // Update order tracking
        this.updateOrderState(update);
        
        // Update position tracking
        this.updatePositionState(update);
        
        // Update orderbook state
        this.updateOrderbookState(update);
    }

    startExchange() {
        // Connect to exchange
        this.connect().then(() => {
            console.log('✅ Successfully connected to OX.fun');
            
            // Start real-time monitoring
            setInterval(() => this.monitorExchange(), 1000);
            setInterval(() => this.validateExchange(), 5000);
            setInterval(() => this.optimizeExchange(), 10000);
            
            // Exchange maintenance
            setInterval(() => this.updateExchange(), 60000);
            setInterval(() => this.pruneHistory(), 300000);
            
            // State persistence
            setInterval(() => this.saveExchangeState(), 24 * 60 * 60 * 1000);
        });
    }
}

module.exports = { OXfunExchange }; 