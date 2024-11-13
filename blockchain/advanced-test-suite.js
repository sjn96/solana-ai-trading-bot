const { Connection, PublicKey } = require('@solana/web3.js');
const { AdaptiveGrowthAnalyzer } = require('./adaptive-growth-analyzer');

class AdvancedTestSuite {
    constructor() {
        this.analyzer = new AdaptiveGrowthAnalyzer();
        this.testScenarios = this.initializeTestScenarios();
        this.results = {
            passed: 0,
            failed: 0,
            scenarios: {}
        };
    }

    initializeTestScenarios() {
        return {
            highGrowthScenario: {
                tokenAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                mockData: {
                    holders: 5000,
                    dailyTx: 1000,
                    liquidityUSD: 500000,
                    holderGrowth: 25,
                    priceGrowth: 150
                },
                expectedOutcome: {
                    growthScore: { min: 80, max: 100 },
                    riskScore: { min: 0, max: 30 },
                    recommendation: 'BUY'
                }
            },
            highRiskScenario: {
                tokenAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                mockData: {
                    holders: 50,
                    dailyTx: 10,
                    liquidityUSD: 5000,
                    holderGrowth: 5,
                    priceGrowth: 300
                },
                expectedOutcome: {
                    growthScore: { min: 60, max: 100 },
                    riskScore: { min: 70, max: 100 },
                    recommendation: 'SKIP'
                }
            },
            historicalSuccessScenario: {
                tokenAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                mockData: {
                    // Data from a known 100x token
                    initialMetrics: {
                        holders: 1000,
                        dailyTx: 500,
                        liquidityUSD: 100000,
                        holderGrowth: 15
                    },
                    growthPattern: {
                        day1: { priceGrowth: 2, holderGrowth: 20 },
                        day7: { priceGrowth: 10, holderGrowth: 100 },
                        day30: { priceGrowth: 100, holderGrowth: 500 }
                    }
                },
                expectedOutcome: {
                    patternRecognition: true,
                    adaptiveThreshold: true
                }
            }
        };
    }

    async runComprehensiveTests() {
        console.log('🚀 Starting Comprehensive Test Suite...\n');

        try {
            // 1. Basic Functionality Tests
            await this.runBasicTests();

            // 2. Pattern Recognition Tests
            await this.runPatternTests();

            // 3. Adaptive Learning Tests
            await this.runAdaptiveTests();

            // 4. Historical Pattern Tests
            await this.runHistoricalTests();

            // Display final results
            this.displayTestResults();

        } catch (error) {
            console.error('❌ Test Suite Error:', error.message);
        }
    }

    async runBasicTests() {
        console.log('1️⃣ Running Basic Functionality Tests...\n');

        // Test high growth scenario
        await this.testScenario('highGrowthScenario');

        // Test high risk scenario
        await this.testScenario('highRiskScenario');
    }

    async testScenario(scenarioName) {
        console.log(`Testing ${scenarioName}...`);
        const scenario = this.testScenarios[scenarioName];
        
        try {
            // Run analysis with mock data
            const analysis = await this.analyzer.analyzeToken(
                scenario.tokenAddress,
                scenario.mockData
            );

            // Validate results
            const passed = this.validateScenario(analysis, scenario.expectedOutcome);
            
            this.results.scenarios[scenarioName] = {
                passed,
                analysis
            };

            passed ? this.results.passed++ : this.results.failed++;
            
            console.log(`${passed ? '✅' : '❌'} ${scenarioName} completed\n`);

        } catch (error) {
            console.error(`❌ Error in ${scenarioName}:`, error.message);
            this.results.failed++;
        }
    }

    async runPatternTests() {
        console.log('2️⃣ Running Pattern Recognition Tests...\n');

        // Test pattern storage
        const patternStored = await this.testPatternStorage();
        
        // Test pattern matching
        const patternMatched = await this.testPatternMatching();

        this.results.scenarios.patternRecognition = {
            passed: patternStored && patternMatched,
            details: {
                storage: patternStored,
                matching: patternMatched
            }
        };
    }

    async runAdaptiveTests() {
        console.log('3️⃣ Running Adaptive Learning Tests...\n');

        // Test threshold adaptation
        const initialThresholds = { ...this.analyzer.thresholds };
        
        // Simulate successful trades
        for (let i = 0; i < 5; i++) {
            await this.simulateSuccessfulTrade();
        }

        // Check if thresholds adapted
        const thresholdsAdapted = this.validateThresholdAdaptation(initialThresholds);
        
        this.results.scenarios.adaptiveLearning = {
            passed: thresholdsAdapted,
            details: {
                initialThresholds,
                finalThresholds: { ...this.analyzer.thresholds }
            }
        };
    }

    async runHistoricalTests() {
        console.log('4️⃣ Running Historical Pattern Tests...\n');

        const scenario = this.testScenarios.historicalSuccessScenario;
        
        // Test with historical data
        const analysis = await this.analyzer.analyzeToken(
            scenario.tokenAddress,
            scenario.mockData
        );

        const passed = this.validateHistoricalPattern(analysis, scenario.expectedOutcome);
        
        this.results.scenarios.historicalPattern = {
            passed,
            analysis
        };
    }

    displayTestResults() {
        console.log('\n📊 TEST RESULTS SUMMARY\n' + '='.repeat(30));
        console.log(`\nTotal Tests: ${this.results.passed + this.results.failed}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        
        console.log('\nDetailed Results:');
        Object.entries(this.results.scenarios).forEach(([name, result]) => {
            console.log(`\n${name}: ${result.passed ? '✅' : '❌'}`);
            if (result.details) {
                console.log('Details:', JSON.stringify(result.details, null, 2));
            }
        });
    }
}

// Run the comprehensive test suite
const testSuite = new AdvancedTestSuite();
testSuite.runComprehensiveTests(); 