const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

class TokenChecker {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        this.walletAddress = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';
    }

    async runBasicChecks() {
        console.log('🔍 Running Basic Token Checks...\n');

        try {
            // 1. Check wallet connection
            await this.checkWalletStatus();

            // 2. Check test token
            await this.checkTestToken();

        } catch (error) {
            console.error('❌ Error during checks:', error.message);
        }
    }

    async checkWalletStatus() {
        console.log('Checking Wallet Status...');
        
        const publicKey = new PublicKey(this.walletAddress);
        const balance = await this.connection.getBalance(publicKey);
        
        console.log('✅ Wallet Connected');
        console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);
    }

    async checkTestToken() {
        try {
            console.log('Checking Test Token (Devnet USDC)...');
            const testTokenAddress = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
            const tokenPublicKey = new PublicKey(testTokenAddress);
            
            const accountInfo = await this.connection.getParsedAccountInfo(tokenPublicKey);
            console.log('✅ Token Account exists:', !!accountInfo.value);

        } catch (error) {
            console.error('Error checking test token:', error.message);
        }
    }
}

// Create instance and run checks
const checker = new TokenChecker();
checker.runBasicChecks();