const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function checkTokenDetailsV2() {
    try {
        console.log('🔍 Starting Enhanced Token Check...\n');

        // 1. Setup connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // 2. Check wallet first
        const walletAddress = '5aZGN6qLzUFnL6PZZSosfoigo5yNF337fEQWEzShEySG';
        const walletBalance = await connection.getBalance(new PublicKey(walletAddress));
        console.log('💰 Wallet Balance:', walletBalance / LAMPORTS_PER_SOL, 'SOL\n');

        // 3. Define test token (Devnet USDC)
        const testToken = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
        console.log('🪙 Analyzing Token:', testToken);

        // 4. Get token info
        const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(testToken));
        
        if (tokenInfo.value) {
            console.log('\n✅ Token Status:');
            console.log('- Exists: Yes');
            console.log('- Program:', tokenInfo.value.owner.toString());

            // 5. Get token accounts
            const accounts = await connection.getTokenLargestAccounts(new PublicKey(testToken));
            console.log('\n💼 Token Accounts:');
            console.log('- Number of accounts:', accounts.value.length);
            
            // Display top 3 accounts by balance
            console.log('- Top Accounts:');
            accounts.value.slice(0, 3).forEach((account, index) => {
                console.log(`  ${index + 1}. Address: ${account.address}`);
                console.log(`     Amount: ${account.amount} tokens`);
            });

            // 6. Check token activity
            console.log('\n📊 Token Activity:');
            const blockHeight = await connection.getBlockHeight();
            console.log('- Current block:', blockHeight);
            
            // Get recent transactions
            const signatures = await connection.getSignaturesForAddress(
                new PublicKey(testToken),
                { limit: 3 }
            );
            
            console.log('- Recent Transactions:');
            signatures.forEach((sig, index) => {
                console.log(`  ${index + 1}. ${sig.signature}`);
                console.log(`     Block time: ${new Date(sig.blockTime * 1000).toLocaleString()}`);
            });

        } else {
            console.log('❌ Token not found!');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

checkTokenDetailsV2(); 