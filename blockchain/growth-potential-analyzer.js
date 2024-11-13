const { Connection, PublicKey } = require('@solana/web3.js');

class TokenGrowthAnalyzer {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Growth potential indicators based on historical 100x tokens
        this.GROWTH_METRICS = {
            HOLDERS: {
                min: 100,    // Minimum holders for growth potential
                max: 10000   // Not too saturated
            },
            DISTRIBUTION: {
                maxTopHolderPercent: 15,     // Top holder shouldn't own too much
                minTeamTokensLocked: 30,     // Percentage of team tokens should be locked
                healthyDistributionScore: 70  // Gini coefficient-based score
            },
            LIQUIDITY: {
                minPoolSize: 10000,          // Minimum liquidity pool size in USD
                healthyPairRatio: 0.8,       // Ratio of paired tokens
                maxSlippage: 3               // Maximum slippage percentage for $1000 trade
            },
            ACTIVITY: {
                minDailyTx: 50,              // Minimum daily transactions
                growthRate: 5,               // Percentage daily holder growth
                sustainedVolume: 10000       // Minimum 24h volume in USD
            }
        };
    }

    async analyzeGrowthPotential(tokenAddress) {
        console.log('🚀 Analyzing Token Growth Potential...\n');

        try {
            const analysis = {
                basicMetrics: await this.getBasicMetrics(tokenAddress),
                growthMetrics: await this.getGrowthMetrics(tokenAddress),
                riskScore: 0,
                growthScore: 0,
                potential100x: false
            };

            // Calculate scores
            this.calculateScores(analysis);
            
            // Display results
            this.displayAnalysis(analysis);

            return analysis;

        } catch (error) {
            console.error('❌ Error during analysis:', error.message);
            return null;
        }
    }

    async getBasicMetrics(tokenAddress) {
        const tokenInfo = await this.connection.getParsedAccountInfo(new PublicKey(tokenAddress));
        const accounts = await this.connection.getTokenLargestAccounts(new PublicKey(tokenAddress));
        
        return {
            exists: !!tokenInfo.value,
            programId: tokenInfo.value?.owner.toString(),
            totalHolders: accounts.value.length,
            totalSupply: accounts.value.reduce((sum, acc) => sum + Number(acc.amount), 0)
        };
    }

    async getGrowthMetrics(tokenAddress) {
        const signatures = await this.connection.getSignaturesForAddress(
            new PublicKey(tokenAddress),
            { limit: 100 }
        );

        return {
            dailyTransactions: signatures.length,
            holderGrowth: await this.calculateHolderGrowth(tokenAddress),
            liquidityMetrics: await this.getLiquidityMetrics(tokenAddress),
            distributionScore: await this.calculateDistributionScore(tokenAddress)
        };
    }

    async calculateHolderGrowth(tokenAddress) {
        // Simplified for example - would need historical data
        return {
            dailyGrowthRate: 0,
            weeklyGrowthRate: 0,
            sustainedGrowth: false
        };
    }

    async getLiquidityMetrics(tokenAddress) {
        // Would integrate with DEX APIs for real data
        return {
            poolSize: 0,
            pairRatio: 0,
            slippage: 0
        };
    }

    async calculateDistributionScore(tokenAddress) {
        const accounts = await this.connection.getTokenLargestAccounts(new PublicKey(tokenAddress));
        
        // Calculate basic distribution metrics
        const totalSupply = accounts.value.reduce((sum, acc) => sum + Number(acc.amount), 0);
        const topHolder = Number(accounts.value[0].amount) / totalSupply * 100;
        
        return {
            topHolderPercent: topHolder,
            distributionScore: 0, // Would calculate Gini coefficient
            isHealthyDistribution: topHolder < this.GROWTH_METRICS.DISTRIBUTION.maxTopHolderPercent
        };
    }

    calculateScores(analysis) {
        // Risk Score (0-100, lower is better)
        analysis.riskScore = this.calculateRiskScore(analysis);
        
        // Growth Score (0-100, higher is better)
        analysis.growthScore = this.calculateGrowthScore(analysis);
        
        // Potential for 100x
        analysis.potential100x = 
            analysis.riskScore < 30 && 
            analysis.growthScore > 70;
    }

    calculateRiskScore(analysis) {
        // Implement risk scoring based on metrics
        return 50; // Placeholder
    }

    calculateGrowthScore(analysis) {
        // Implement growth scoring based on metrics
        return 50; // Placeholder
    }

    displayAnalysis(analysis) {
        console.log('📊 GROWTH POTENTIAL ANALYSIS\n' + '='.repeat(35));
        
        console.log('\n1. Basic Metrics:');
        console.log(`   - Total Holders: ${analysis.basicMetrics.totalHolders}`);
        console.log(`   - Total Supply: ${analysis.basicMetrics.totalSupply}`);

        console.log('\n2. Growth Metrics:');
        console.log(`   - Daily Transactions: ${analysis.growthMetrics.dailyTransactions}`);
        console.log(`   - Top Holder %: ${analysis.growthMetrics.distributionScore.topHolderPercent.toFixed(2)}%`);
        
        console.log('\n3. Scores:');
        console.log(`   - Risk Score: ${analysis.riskScore}/100`);
        console.log(`   - Growth Score: ${analysis.growthScore}/100`);
        
        console.log('\n🎯 100x Potential:', analysis.potential100x ? '✅ HIGH' : '⚠️ LOW');
    }
}

// Run the analysis
const analyzer = new TokenGrowthAnalyzer();
analyzer.analyzeGrowthPotential('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); 