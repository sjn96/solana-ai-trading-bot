console.log('Test starting...');

const { Connection, PublicKey } = require('@solana/web3.js');

async function basicTest() {
    try {
        console.log('Creating connection...');
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        console.log('Checking wallet...');
        const walletAddress = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';
        const publicKey = new PublicKey(walletAddress);
        
        console.log('Getting balance...');
        const balance = await connection.getBalance(publicKey);
        
        console.log('Balance:', balance);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

basicTest();