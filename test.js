// Import dependencies
const { Connection } = require('@solana/web3.js');
const axios = require('axios');
require('dotenv').config();

async function testDependencies() {
    try {
        // Test Solana connection
        const connection = new Connection('https://api.devnet.solana.com');
        const blockHeight = await connection.getBlockHeight();
        console.log('✅ Solana Connection Test:', { blockHeight });

        // Test Axios
        const response = await axios.get('https://api.coingecko.com/api/v3/ping');
        console.log('✅ Axios Test:', response.data);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

// Run the tests
testDependencies();