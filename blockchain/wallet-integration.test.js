const PhantomWallet = require('./wallet');
const { PublicKey } = require('@solana/web3.js');

class WalletIntegrationTester {
    constructor() {
        this.wallet = new PhantomWallet();
        this.walletAddress = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';
    }

    async runIntegrationTests() {
        console.log('🧪 Starting Wallet Integration Tests...\n');

        try {
            await this.testConnection();
            await this.testBalanceCheck();
            await this.testBasicTransaction();
            
            console.log('\n✅ All integration tests completed successfully!');

        } catch (error) {
            console.error('\n❌ Integration tests failed:', error.message);
        }
    }

    async testConnection() {
        try {
            console.log('Test 1: Connecting to Phantom Wallet...');
            
            // Connect to wallet
            await this.wallet.connect();
            
            console.log('✅ Successfully connected to Phantom Wallet\n');

        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    async testBalanceCheck() {
        try {
            console.log('Test 2: Checking Wallet Balance...');
            
            const balance = await this.wallet.getBalance();
            console.log(`✅ Current balance: ${balance} SOL\n`);

            if (balance <= 0) {
                console.warn('⚠️ Warning: Wallet balance is 0. Some tests may fail.');
            }

        } catch (error) {
            throw new Error(`Balance check failed: ${error.message}`);
        }
    }

    async testBasicTransaction() {
        try {
            console.log('Test 3: Testing Basic Transaction Capabilities...');
            
            // Test transaction creation (without sending)
            const transaction = await this.wallet.createBasicTransaction(
                this.walletAddress,
                0.001
            );

            console.log('✅ Successfully created test transaction\n');

        } catch (error) {
            throw new Error(`Transaction test failed: ${error.message}`);
        }
    }
}

// Run the tests
const tester = new WalletIntegrationTester();
tester.runIntegrationTests(); 