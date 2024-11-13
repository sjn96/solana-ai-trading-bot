console.log('🚀 Test starting...');

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function improvedTest() {
    try {
        console.log('\n1️⃣ Creating connection...');
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        console.log('2️⃣ Checking wallet...');
        const walletAddress = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';
        const publicKey = new PublicKey(walletAddress);
        
        console.log('3️⃣ Getting balance...');
        const balance = await connection.getBalance(publicKey);
        
        console.log('\n💰 Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
        
        // Get recent blockhash to verify connection
        console.log('\n4️⃣ Checking network status...');
        const blockHeight = await connection.getBlockHeight();
        console.log('📦 Current block height:', blockHeight);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

improvedTest(); 