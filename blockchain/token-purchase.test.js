const PhantomWallet = require('./wallet');
const { PublicKey } = require('@solana/web3.js');

class TokenPurchaseTester {
    constructor() {
        this.wallet = new PhantomWallet();
        // Test token address (using a devnet token)
        this.testTokenAddress = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC
    }

    async runPurchaseTests() {
        console.log('🧪 Starting Token Purchase Tests...\n');

        try {
            await this.testPriceCheck();
            await this.testLiquidityCheck();
            await this.testSafetyChecks();
            await this.testPurchaseConditions();
            
            console.log('\n✅ All token purchase tests completed!');

        } catch (error) {
            console.error('\n❌ Token purchase tests failed:', error.message);
        }
    }

    async testPriceCheck() {
        try {
            console.log('Test 1: Token Price Check...');
            
            const price = await this.wallet.getTokenPrice(this.testTokenAddress);
            console.log(`✅ Token price retrieved: ${price} SOL\n`);

        } catch (error) {
            throw new Error(`Price check failed: ${error.message}`);
        }
    }

    async testLiquidityCheck() {
        try {
            console.log('Test 2: Liquidity Check...');
            
            const liquidity = await this.wallet.checkTokenLiquidity(this.testTokenAddress);
            console.log('✅ Liquidity check completed:', {
                supply: liquidity.supply,
                holders: liquidity.holders,
                isLiquid: liquidity.isLiquid
            }, '\n');

        } catch (error) {
            throw new Error(`Liquidity check failed: ${error.message}`);
        }
    }

    async testSafetyChecks() {
        try {
            console.log('Test 3: Safety Checks...');
            
            await this.wallet.performSafetyChecks(
                this.testTokenAddress,
                0.1,
                { maxPrice: 100, maxSlippage: 0.05 }
            );
            console.log('✅ Safety checks passed\n');

        } catch (error) {
            throw new Error(`Safety checks failed: ${error.message}`);
        }
    }

    async testPurchaseConditions() {
        try {
            console.log('Test 4: Purchase Conditions...');
            
            // Test 4.1: Price too high
            console.log('Testing price limit condition...');
            const highPriceResult = await this.wallet.buyToken(
                this.testTokenAddress,
                0.1,
                { maxPrice: 0.0001 } // Very low max price to trigger condition
            );
            console.log('Price limit test:', highPriceResult.success ? '❌ Failed' : '✅ Passed');

            // Test 4.2: Insufficient liquidity
            console.log('Testing liquidity condition...');
            const lowLiquidityResult = await this.wallet.buyToken(
                this.testTokenAddress,
                0.1,
                { minLiquidity: 999999999 } // Very high liquidity requirement
            );
            console.log('Liquidity test:', lowLiquidityResult.success ? '❌ Failed' : '✅ Passed');

            // Test 4.3: Valid purchase conditions
            console.log('Testing valid purchase conditions...');
            const validPurchaseResult = await this.wallet.buyToken(
                this.testTokenAddress,
                0.1,
                {
                    maxPrice: 100,
                    maxSlippage: 0.05,
                    minLiquidity: 1000,
                    minHolders: 100
                }
            );
            console.log('Valid purchase test:', validPurchaseResult.success ? '✅ Passed' : '❌ Failed');

        } catch (error) {
            throw new Error(`Purchase conditions test failed: ${error.message}`);
        }
    }
}

// Run the tests
const tester = new TokenPurchaseTester();
tester.runPurchaseTests(); 