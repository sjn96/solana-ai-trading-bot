const PhantomWallet = require('./wallet');
const { PublicKey } = require('@solana/web3.js');

// Test configuration
const TEST_CONFIG = {
    TOKEN_ADDRESS: 'Your_Test_Token_Address',
    RECIPIENT_ADDRESS: 'Your_Test_Recipient_Address',
    SERUM_MARKET: 'Your_Test_Serum_Market_Address'
};

class WalletTester {
    constructor() {
        this.wallet = new PhantomWallet();
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive Wallet Tests...\n');

        try {
            await this.testWalletConnection();
            await this.testTokenPriceFetching();
            await this.testLiquidityChecks();
            await this.testSafetyChecks();
            await this.testTokenPurchase();
            
            this.displayTestResults();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testWalletConnection() {
        try {
            console.log('Test 1: Wallet Connection');
            
            // Connect to wallet
            const publicKey = await this.wallet.connect();
            
            // Check balance
            const balance = await this.wallet.getBalance();
            
            this.recordTestResult('Wallet Connection', true, {
                publicKey: publicKey.toString(),
                balance: `${balance} SOL`
            });

        } catch (error) {
            this.recordTestResult('Wallet Connection', false, {
                error: error.message
            });
        }
    }

    recordTestResult(testName, passed, result) {
        this.testResults.push({
            testName,
            passed,
            result
        });
    }

    displayTestResults() {
        this.testResults.forEach((result, index) => {
            console.log(`Test ${index + 1}: ${result.testName} - ${result.passed ? '✅' : '❌'}`);
            if (!result.passed) {
                console.error('❌ Test failed:', result.result);
            }
        });
    }
}

// Run the tests
const walletTester = new WalletTester();
walletTester.runAllTests(); 