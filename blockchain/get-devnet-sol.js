const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function requestAirdrop(walletAddress) {
    try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const publicKey = new PublicKey(walletAddress);

        console.log('Requesting airdrop of 2 SOL to:', walletAddress);
        const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
        
        console.log('Confirming transaction...');
        await connection.confirmTransaction(signature);
        
        const balance = await connection.getBalance(publicKey);
        console.log('✅ New wallet balance:', balance / LAMPORTS_PER_SOL, 'SOL');

    } catch (error) {
        console.error('Error requesting airdrop:', error);
    }
}

// Your wallet address
const YOUR_WALLET_ADDRESS = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';

requestAirdrop(YOUR_WALLET_ADDRESS); 