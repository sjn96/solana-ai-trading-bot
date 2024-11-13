const { 
    Connection, 
    PublicKey, 
    Transaction, 
    SystemProgram, 
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { Market } = require('@project-serum/serum');
const Decimal = require('decimal.js');

class PhantomWallet {
    constructor() {
        this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        this.wallet = null;
        this.MIN_SOL_BALANCE = 0.05; // Minimum SOL to keep for fees
    }

    // Connect to Phantom Wallet
    async connect() {
        try {
            // Check if Phantom is installed
            const { solana } = window;
            
            if (!solana?.isPhantom) {
                throw new Error('Phantom wallet is not installed!');
            }

            // Connect to wallet
            const response = await solana.connect();
            this.wallet = response.publicKey;
            console.log('Connected to wallet:', this.wallet.toString());
            return this.wallet;

        } catch (error) {
            console.error('Error connecting to Phantom wallet:', error);
            throw error;
        }
    }

    // Send SOL to another address
    async sendSol(toAddress, amount) {
        try {
            const { solana } = window;
            
            // Create transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this.wallet,
                    toPubkey: new PublicKey(toAddress),
                    lamports: amount * LAMPORTS_PER_SOL
                })
            );

            // Get latest blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.wallet;

            // Sign and send transaction
            const signed = await solana.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(signed.serialize());
            
            // Confirm transaction
            await this.connection.confirmTransaction(signature);
            return signature;

        } catch (error) {
            console.error('Error sending SOL:', error);
            throw error;
        }
    }

    async getTokenPrice(tokenAddress) {
        try {
            // Get Serum market for the token
            const marketAddress = await this.findSerumMarket(tokenAddress);
            if (!marketAddress) {
                throw new Error('No market found for token');
            }

            const market = await Market.load(
                this.connection,
                new PublicKey(marketAddress),
                {},
                TOKEN_PROGRAM_ID
            );

            // Get orderbook
            const [bids, asks] = await Promise.all([
                market.loadBids(this.connection),
                market.loadAsks(this.connection)
            ]);

            // Get best ask price
            const bestAsk = asks.getL2(1)[0];
            if (!bestAsk) {
                throw new Error('No ask orders found');
            }

            return new Decimal(bestAsk[0]).toNumber();

        } catch (error) {
            console.error('Error fetching token price:', error);
            throw error;
        }
    }

    async checkTokenLiquidity(tokenAddress) {
        try {
            const tokenAccount = await this.connection.getParsedAccountInfo(
                new PublicKey(tokenAddress)
            );

            if (!tokenAccount.value) {
                return 0;
            }

            // Get token supply and holder count
            const supply = tokenAccount.value.data.parsed.info.supply;
            const holders = await this.getTokenHolders(tokenAddress);

            return {
                supply,
                holders,
                isLiquid: holders > 100 && supply > 1000 // Example threshold
            };

        } catch (error) {
            console.error('Error checking liquidity:', error);
            throw error;
        }
    }

    async buyToken(tokenAddress, amount, conditions = {}) {
        try {
            const { 
                maxPrice = Infinity,
                maxSlippage = 0.05,
                minLiquidity = 1000,
                minHolders = 100
            } = conditions;

            // Safety checks
            await this.performSafetyChecks(tokenAddress, amount, conditions);

            // Get current price and check conditions
            const currentPrice = await this.getTokenPrice(tokenAddress);
            if (currentPrice > maxPrice) {
                return {
                    success: false,
                    message: `Price ${currentPrice} exceeds max price ${maxPrice}`
                };
            }

            // Check liquidity
            const liquidity = await this.checkTokenLiquidity(tokenAddress);
            if (!liquidity.isLiquid || liquidity.holders < minHolders) {
                return {
                    success: false,
                    message: 'Insufficient liquidity or holder count'
                };
            }

            // Calculate maximum spend with slippage
            const maxSpend = amount * currentPrice * (1 + maxSlippage);

            // Create and send transaction
            const transaction = await this.createBuyTransaction(
                tokenAddress,
                amount,
                maxSpend
            );

            const signature = await this.sendAndConfirmTransaction(transaction);

            return {
                success: true,
                signature,
                price: currentPrice,
                amount,
                totalSpent: maxSpend
            };

        } catch (error) {
            console.error('Error buying token:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async performSafetyChecks(tokenAddress, amount, conditions) {
        // Check wallet balance
        const balance = await this.getBalance();
        if (balance < this.MIN_SOL_BALANCE) {
            throw new Error('Insufficient SOL balance for transaction');
        }

        // Validate token contract
        const tokenInfo = await this.connection.getParsedAccountInfo(
            new PublicKey(tokenAddress)
        );
        if (!tokenInfo.value) {
            throw new Error('Invalid token address');
        }

        // Check if token is frozen or paused
        const tokenAccount = await Token.getAssociatedTokenAddress(
            TOKEN_PROGRAM_ID,
            new PublicKey(tokenAddress),
            this.wallet
        );
        
        const accountInfo = await this.connection.getParsedAccountInfo(tokenAccount);
        if (accountInfo.value?.data.parsed.info.state === 'frozen') {
            throw new Error('Token is frozen');
        }
    }

    // Helper method to create buy transaction
    async createBuyTransaction(tokenAddress, amount, maxSpend) {
        // Implementation will depend on the DEX you're using
        // This is a placeholder for the actual implementation
        const transaction = new Transaction();
        // Add necessary instructions for token purchase
        return transaction;
    }

    // Helper method to send and confirm transaction
    async sendAndConfirmTransaction(transaction) {
        const { solana } = window;
        const signed = await solana.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(
            signed.serialize()
        );
        await this.connection.confirmTransaction(signature);
        return signature;
    }

    // Check wallet balance
    async getBalance() {
        try {
            const balance = await this.connection.getBalance(this.wallet);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }
}

module.exports = PhantomWallet; 