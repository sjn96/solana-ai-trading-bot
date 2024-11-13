const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function simpleCheck() {
    try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const publicKey = new PublicKey('5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG');
        
        console.log('Checking wallet connection...');
        const balance = await connection.getBalance(publicKey);
        console.log('✅ Wallet balance:', balance / LAMPORTS_PER_SOL, 'SOL');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

simpleCheck(); 