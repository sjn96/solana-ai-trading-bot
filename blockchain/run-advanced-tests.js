const { AdvancedTestSuite } = require('./advanced-test-suite');
const fs = require('fs');

class TestRunner {
    constructor() {
        this.testSuite = new AdvancedTestSuite();
        this.testResults = {
            timestamp: new Date().toISOString(),
            scenarios: {},
            patterns: [],
            adaptiveMetrics: {},
            performance: {
                startTime: Date.now(),
                endTime: null,
                duration: null
            }
        };
    }

    async runTests() {
        console.log('🤖 Starting AI-Enhanced Trading Bot Test Suite...\n');

        try {
            // 1. Run Core Analysis Tests
            await this.runCoreTests();

            // 2. Run AI Pattern Recognition Tests
            await this.runPatternTests();

            // 3. Run Adaptive Learning Tests
            await this.runAdaptiveTests();

            // Save and analyze results
            this.completeTestRun();

        } catch (error) {
            console.error('❌ Test Runner Error:', error.message);
            this.logError(error);
        }
    }

    async runCoreTests() {
        console.log('1️⃣ Running Core Analysis Tests...\n');

        const scenarios = [
            {
                name: 'High Growth Token',
                data: {
                    holders: 5000,
                    dailyTx: 1000,
                    liquidityUSD: 500000,
                    holderGrowth: 25,
                    priceGrowth: 150,
                    socialSignals: {
                        twitter: 85,
                        telegram: 90,
                        github: 75
                    }
                }
            },
            {
                name: 'Rapid Growth Pattern',
                data: {
                    holders: 2000,
                    dailyTx: 800,
                    liquidityUSD: 250000,
                    holderGrowth: 40,
                    priceGrowth: 200,
                    socialSignals: {
                        twitter: 95,
                        telegram: 88,
                        github: 70
                    }
                }
            }
        ];

        for (const scenario of scenarios) {
            console.log(`Testing ${scenario.name}...`);
            const result = await this.testSuite.analyzer.analyzeToken(
                '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                scenario.data
            );
            
            this.testResults.scenarios[scenario.name] = {
                input: scenario.data,
                output: result,
                patterns: this.analyzePatterns(result)
            };

            this.logScenarioResults(scenario.name, result);
        }
    }

    async runPatternTests() {
        console.log('\n2️⃣ Running AI Pattern Recognition Tests...\n');

        // Test with historical 100x token patterns
        const historicalPatterns = [
            {
                name: '100x Pattern 1',
                metrics: {
                    initialHolders: 1000,
                    day7Holders: 5000,
                    day30Holders: 25000,
                    liquidityGrowth: 1000,
                    priceAction: {
                        day1: 2,
                        day7: 10,
                        day30: 100
                    }
                }
            },
            {
                name: '1000x Pattern 1',
                metrics: {
                    initialHolders: 500,
                    day7Holders: 10000,
                    day30Holders: 50000,
                    liquidityGrowth: 5000,
                    priceAction: {
                        day1: 5,
                        day7: 50,
                        day30: 1000
                    }
                }
            }
        ];

        for (const pattern of historicalPatterns) {
            console.log(`Testing ${pattern.name}...`);
            const recognition = await this.testSuite.analyzer.recognizePattern(pattern.metrics);
            
            this.testResults.patterns.push({
                pattern: pattern.name,
                recognition: recognition,
                confidence: recognition.confidence,
                matchedFeatures: recognition.matchedFeatures
            });

            this.logPatternResults(pattern.name, recognition);
        }
    }

    async runAdaptiveTests() {
        console.log('\n3️⃣ Running Adaptive Learning Tests...\n');

        // Test threshold adaptation
        const adaptiveTests = [
            {
                name: 'High Success Rate Adaptation',
                successRate: 80,
                trades: 20
            },
            {
                name: 'Learning Period Adaptation',
                successRate: 60,
                trades: 50
            }
        ];

        for (const test of adaptiveTests) {
            console.log(`Testing ${test.name}...`);
            const adaptation = await this.testSuite.analyzer.simulateAdaptation(
                test.successRate,
                test.trades
            );

            this.testResults.adaptiveMetrics[test.name] = {
                input: test,
                thresholdChanges: adaptation.thresholdChanges,
                learningRate: adaptation.learningRate
            };

            this.logAdaptiveResults(test.name, adaptation);
        }
    }

    analyzePatterns(result) {
        return {
            growthIndicators: this.extractGrowthPatterns(result),
            riskFactors: this.extractRiskPatterns(result),
            confidenceMetrics: this.calculateConfidence(result)
        };
    }

    extractGrowthPatterns(result) {
        // Implement pattern extraction logic
        return {
            holderGrowthRate: result.metrics?.growth?.holderGrowth || 0,
            liquidityGrowthRate: result.metrics?.growth?.liquidity || 0,
            transactionGrowth: result.metrics?.growth?.dailyTx || 0
        };
    }

    extractRiskPatterns(result) {
        // Implement risk pattern extraction
        return {
            liquidityRisk: result.metrics?.risk?.liquidityRisk || 0,
            concentrationRisk: result.metrics?.risk?.concentrationRisk || 0,
            volatilityRisk: result.metrics?.risk?.volatility || 0
        };
    }

    calculateConfidence(result) {
        // Implement confidence calculation
        return {
            growthConfidence: result.scores?.growth || 0,
            riskConfidence: result.scores?.risk || 0,
            overallConfidence: result.scores?.potential || 0
        };
    }

    logScenarioResults(name, result) {
        console.log(`\n📊 ${name} Results:`);
        console.log(`- Growth Score: ${result.scores.growth}`);
        console.log(`- Risk Score: ${result.scores.risk}`);
        console.log(`- Potential Score: ${result.scores.potential}`);
        console.log(`- Recommendation: ${result.recommendation.action}`);
    }

    logPatternResults(name, recognition) {
        console.log(`\n🔍 ${name} Pattern Recognition:`);
        console.log(`- Confidence: ${recognition.confidence}%`);
        console.log(`- Matched Features: ${recognition.matchedFeatures.length}`);
    }

    logAdaptiveResults(name, adaptation) {
        console.log(`\n📈 ${name} Adaptation:`);
        console.log(`- Learning Rate: ${adaptation.learningRate}`);
        console.log(`- Threshold Changes: ${Object.keys(adaptation.thresholdChanges).length}`);
    }

    completeTestRun() {
        this.testResults.performance.endTime = Date.now();
        this.testResults.performance.duration = 
            this.testResults.performance.endTime - 
            this.testResults.performance.startTime;

        // Save results to file
        this.saveResults();

        // Display summary
        this.displaySummary();
    }

    saveResults() {
        const filename = `test-results-${Date.now()}.json`;
        fs.writeFileSync(
            filename,
            JSON.stringify(this.testResults, null, 2)
        );
        console.log(`\n💾 Results saved to ${filename}`);
    }

    displaySummary() {
        console.log('\n📑 TEST SUMMARY\n' + '='.repeat(30));
        console.log(`\nScenarios Tested: ${Object.keys(this.testResults.scenarios).length}`);
        console.log(`Patterns Analyzed: ${this.testResults.patterns.length}`);
        console.log(`Adaptive Tests: ${Object.keys(this.testResults.adaptiveMetrics).length}`);
        console.log(`Duration: ${this.testResults.performance.duration}ms`);
    }

    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        };
        fs.appendFileSync('error-log.json', JSON.stringify(errorLog, null, 2) + '\n');
    }
}

// Run the tests
const runner = new TestRunner();
runner.runTests(); 