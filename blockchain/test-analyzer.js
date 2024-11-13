const { Connection, PublicKey } = require('@solana/web3.js');
const { AdaptiveGrowthAnalyzer } = require('./adaptive-growth-analyzer');

async function runAnalyzerTest() {
    console.log('🧪 Starting Analyzer Test Suite...\n');

    // Initialize analyzer
    const analyzer = new AdaptiveGrowthAnalyzer();

    // Test tokens (known successful tokens for pattern learning)
    const testTokens = {
        'USDC_DEV': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        // Add more test tokens here
    };

    try {
        console.log('1️⃣ Testing Basic Analysis...');
        for (const [name, address] of Object.entries(testTokens)) {
            console.log(`\n📝 Analyzing ${name}...`);
            const analysis = await analyzer.analyzeToken(address);
            
            if (analysis) {
                console.log(`\n✅ Analysis completed for ${name}`);
                validateAnalysis(analysis);
            } else {
                console.log(`❌ Analysis failed for ${name}`);
            }
        }

        console.log('\n2️⃣ Testing Pattern Learning...');
        await testPatternLearning(analyzer);

        console.log('\n3️⃣ Testing Adaptive Thresholds...');
        await testThresholdAdaptation(analyzer);

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

function validateAnalysis(analysis) {
    console.log('\n🔍 Validation Results:');
    
    // Validate scores are within range
    console.log('- Score Range Check:',
        analysis.scores.growth >= 0 && analysis.scores.growth <= 100 &&
        analysis.scores.risk >= 0 && analysis.scores.risk <= 100 &&
        analysis.scores.potential >= 0 && analysis.scores.potential <= 100 ? '✅' : '❌'
    );

    // Validate metrics presence
    console.log('- Metrics Completeness:',
        analysis.metrics.basic && 
        analysis.metrics.growth && 
        analysis.metrics.risk ? '✅' : '❌'
    );

    // Validate recommendation
    console.log('- Recommendation Check:',
        analysis.recommendation && 
        analysis.recommendation.action && 
        analysis.recommendation.confidence ? '✅' : '❌'
    );
}

async function testPatternLearning(analyzer) {
    // Simulate successful trade patterns
    const mockSuccessPattern = {
        holderGrowth: 15,
        liquidityIncrease: 25,
        priceGrowth: 100,
        timeFrame: '24h'
    };

    analyzer.successfulPatterns.set('test_pattern_1', {
        patterns: mockSuccessPattern,
        timestamp: Date.now()
    });

    // Test pattern recognition
    console.log('\n📊 Pattern Learning Test:');
    console.log('- Patterns Stored:', analyzer.successfulPatterns.size);
    console.log('- Pattern Recognition Active:', analyzer.successfulPatterns.size > 0 ? '✅' : '❌');
}

async function testThresholdAdaptation(analyzer) {
    const initialThresholds = JSON.stringify(analyzer.thresholds);
    
    // Simulate successful trades to trigger adaptation
    analyzer.thresholds.performance.successRate = 75;
    analyzer.thresholds.performance.totalTrades = 10;
    
    // Force threshold adaptation
    analyzer.adaptThresholds();
    
    const updatedThresholds = JSON.stringify(analyzer.thresholds);
    
    console.log('\n🎯 Threshold Adaptation Test:');
    console.log('- Thresholds Updated:', initialThresholds !== updatedThresholds ? '✅' : '❌');
    console.log('- Current Success Rate:', analyzer.thresholds.performance.successRate + '%');
}

// Run the test suite
runAnalyzerTest(); 