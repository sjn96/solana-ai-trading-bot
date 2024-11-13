const { Connection, PublicKey } = require('@solana/web3.js');

class TokenSafetyChecker {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        this.MINIMUM_HOLDERS = 10;
        this.MINIMUM_TRANSACTIONS = 2;
    }

    async checkTokenSafety(tokenAddress) {
        console.log('🛡️ Running Token Safety Checks...\n');

        try {
            const results = {
                isValid: false,
                programCheck: false,
                liquidityCheck: false,
                activityCheck: false,
                details: {}
            };

            // 1. Basic Validation
            const tokenInfo = await this.connection.getParsedAccountInfo(
                new PublicKey(tokenAddress)
            );

            if (!tokenInfo.value) {
                throw new Error('Token not found');
            }

            // 2. Program Check
            results.programCheck = this.checkProgram(tokenInfo.value.owner.toString());
            
            // 3. Liquidity Check
            const accounts = await this.connection.getTokenLargestAccounts(
                new PublicKey(tokenAddress)
            );
            results.liquidityCheck = this.checkLiquidity(accounts);
            results.details.holders = accounts.value.length;

            // 4. Activity Check
            const signatures = await this.connection.getSignaturesForAddress(
                new PublicKey(tokenAddress),
                { limit: 10 }
            );
            results.activityCheck = this.checkActivity(signatures);
            results.details.recentTransactions = signatures.length;

            // 5. Overall Safety Assessment
            results.isValid = results.programCheck && 
                            results.liquidityCheck && 
                            results.activityCheck;

            this.displayResults(results);
            return results;

        } catch (error) {
            console.error('❌ Error during safety check:', error.message);
            return null;
        }
    }

    checkProgram(programId) {
        const VALID_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        return programId === VALID_PROGRAM;
    }

    checkLiquidity(accounts) {
        return accounts.value.length >= this.MINIMUM_HOLDERS;
    }

    checkActivity(signatures) {
        return signatures.length >= this.MINIMUM_TRANSACTIONS;
    }

    displayResults(results) {
        console.log('📊 Safety Check Results:\n');
        console.log('✓ Program Check:', results.programCheck ? 'PASSED' : 'FAILED');
        console.log('✓ Liquidity Check:', results.liquidityCheck ? 'PASSED' : 'FAILED');
        console.log('✓ Activity Check:', results.activityCheck ? 'PASSED' : 'FAILED');
        console.log('\n📈 Details:');
        console.log('- Holders:', results.details.holders);
        console.log('- Recent Transactions:', results.details.recentTransactions);
        console.log('\n🎯 Overall Safety:', results.isValid ? 'SAFE' : 'UNSAFE');
    }
}

// Run the safety check
const checker = new TokenSafetyChecker();
checker.checkTokenSafety('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); 