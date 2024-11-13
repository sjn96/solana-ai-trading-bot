const { Connection, PublicKey } = require('@solana/web3.js');

class TokenSafetyChecker {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Safety thresholds
        this.MINIMUM_HOLDERS = 10;
        this.MINIMUM_TRANSACTIONS = 2;
        this.MINIMUM_LARGEST_HOLDER_PERCENT = 10;
        this.MAXIMUM_LARGEST_HOLDER_PERCENT = 90;
        this.MINIMUM_ACTIVE_TIME_HOURS = 24;
    }

    async analyzeSafety(tokenAddress) {
        console.log('🔍 Starting Comprehensive Token Safety Analysis...\n');

        try {
            // Initialize results object
            const results = {
                basic: { passed: false, details: {} },
                liquidity: { passed: false, details: {} },
                distribution: { passed: false, details: {} },
                activity: { passed: false, details: {} },
                overall: false
            };

            // 1. Basic Token Validation
            console.log('1️⃣ Checking Basic Token Information...');
            await this.performBasicChecks(tokenAddress, results.basic);

            // 2. Liquidity Analysis
            console.log('\n2️⃣ Analyzing Liquidity...');
            await this.analyzeLiquidity(tokenAddress, results.liquidity);

            // 3. Token Distribution
            console.log('\n3️⃣ Checking Token Distribution...');
            await this.analyzeDistribution(tokenAddress, results.distribution);

            // 4. Activity Analysis
            console.log('\n4️⃣ Analyzing Recent Activity...');
            await this.analyzeActivity(tokenAddress, results.activity);

            // Calculate overall safety
            results.overall = this.calculateOverallSafety(results);

            // Display comprehensive results
            this.displayResults(results);

            return results;

        } catch (error) {
            console.error('❌ Error during analysis:', error.message);
            return null;
        }
    }

    async performBasicChecks(tokenAddress, results) {
        const tokenInfo = await this.connection.getParsedAccountInfo(new PublicKey(tokenAddress));
        
        results.details.exists = !!tokenInfo.value;
        results.details.programId = tokenInfo.value?.owner.toString();
        results.details.isValidProgram = 
            tokenInfo.value?.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        
        results.passed = results.details.exists && results.details.isValidProgram;
    }

    async analyzeLiquidity(tokenAddress, results) {
        const accounts = await this.connection.getTokenLargestAccounts(new PublicKey(tokenAddress));
        
        results.details.totalAccounts = accounts.value.length;
        results.details.totalSupply = accounts.value.reduce((sum, acc) => sum + Number(acc.amount), 0);
        
        results.passed = accounts.value.length >= this.MINIMUM_HOLDERS;
    }

    async analyzeDistribution(tokenAddress, results) {
        const accounts = await this.connection.getTokenLargestAccounts(new PublicKey(tokenAddress));
        
        if (accounts.value.length > 0) {
            const totalSupply = accounts.value.reduce((sum, acc) => sum + Number(acc.amount), 0);
            const largestHolder = Number(accounts.value[0].amount);
            const largestHolderPercent = (largestHolder / totalSupply) * 100;

            results.details.largestHolderPercent = largestHolderPercent;
            results.details.topHolders = accounts.value.slice(0, 3).map(acc => ({
                address: acc.address.toString(),
                percent: (Number(acc.amount) / totalSupply) * 100
            }));

            results.passed = 
                largestHolderPercent >= this.MINIMUM_LARGEST_HOLDER_PERCENT &&
                largestHolderPercent <= this.MAXIMUM_LARGEST_HOLDER_PERCENT;
        }
    }

    async analyzeActivity(tokenAddress, results) {
        const signatures = await this.connection.getSignaturesForAddress(
            new PublicKey(tokenAddress),
            { limit: 10 }
        );

        results.details.recentTransactions = signatures.length;
        results.details.lastTransaction = signatures[0] ? 
            new Date(signatures[0].blockTime * 1000).toLocaleString() : 'None';

        results.passed = signatures.length >= this.MINIMUM_TRANSACTIONS;
    }

    calculateOverallSafety(results) {
        return results.basic.passed && 
               results.liquidity.passed && 
               results.distribution.passed && 
               results.activity.passed;
    }

    displayResults(results) {
        console.log('\n📊 SAFETY ANALYSIS RESULTS\n' + '='.repeat(30));
        
        console.log('\n1. Basic Validation:', this.getStatusEmoji(results.basic.passed));
        console.log('   - Token Exists:', results.basic.details.exists);
        console.log('   - Valid Program:', results.basic.details.isValidProgram);

        console.log('\n2. Liquidity Status:', this.getStatusEmoji(results.liquidity.passed));
        console.log('   - Total Holders:', results.liquidity.details.totalAccounts);
        console.log('   - Total Supply:', results.liquidity.details.totalSupply);

        console.log('\n3. Distribution:', this.getStatusEmoji(results.distribution.passed));
        console.log('   - Largest Holder %:', results.distribution.details.largestHolderPercent?.toFixed(2) + '%');
        
        console.log('\n4. Activity:', this.getStatusEmoji(results.activity.passed));
        console.log('   - Recent Transactions:', results.activity.details.recentTransactions);
        console.log('   - Last Transaction:', results.activity.details.lastTransaction);

        console.log('\n🎯 OVERALL SAFETY:', this.getStatusEmoji(results.overall), 
            results.overall ? 'SAFE TO TRADE' : 'USE CAUTION');
    }

    getStatusEmoji(passed) {
        return passed ? '✅' : '⚠️';
    }
}

// Run the analysis
const checker = new TokenSafetyChecker();
checker.analyzeSafety('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
