const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function checkBalance(walletAddress) {
    try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const publicKey = new PublicKey(walletAddress);
        
        const balance = await connection.getBalance(publicKey);
        console.log('💰 Current wallet balance:', balance / LAMPORTS_PER_SOL, 'SOL');

    } catch (error) {
        console.error('Error checking balance:', error);
    }
}

// Your wallet address
const YOUR_WALLET_ADDRESS = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';

checkBalance(YOUR_WALLET_ADDRESS); 