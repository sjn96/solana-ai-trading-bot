const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function checkTokenDetails() {
    try {
        console.log('🔍 Starting Detailed Token Check...\n');

        // 1. Setup connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // 2. Define test token (Devnet USDC)
        const testToken = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
        console.log('🪙 Checking Token:', testToken);

        // 3. Get token info
        const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(testToken));
        
        // 4. Display token details
        if (tokenInfo.value) {
            console.log('\n✅ Token Found!');
            console.log('📊 Token Details:');
            console.log('- Program ID:', tokenInfo.value.owner.toString());
            console.log('- Data Size:', tokenInfo.value.data.length, 'bytes');
            
            // 5. Get token accounts
            const accounts = await connection.getTokenLargestAccounts(new PublicKey(testToken));
            console.log('\n👥 Token Accounts:', accounts.value.length);
            
            // 6. Get recent activity
            const signatures = await connection.getSignaturesForAddress(new PublicKey(testToken), {
                limit: 5
            });
            console.log('\n🔄 Recent Transactions:', signatures.length);
        } else {
            console.log('❌ Token not found!');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

checkTokenDetails(); 