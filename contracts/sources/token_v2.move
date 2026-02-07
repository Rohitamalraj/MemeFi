/// MemeFi Token Module V2
/// Simplified token system for fair launch platform
/// Uses custom balance tracking instead of Sui Coin for easier dynamic token creation
/// Supports hybrid model: platform balances + wallet withdrawals
/// WITH BONDING CURVE: Real SUI treasury for buy/sell
module memefi::token_v2 {
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use memefi::wrapped_token::{Self, WRAPPED_TOKEN};

    /// Errors
    const EExceedsMaxBuy: u64 = 1;
    const ETransfersLocked: u64 = 2;
    const EInsufficientBalance: u64 = 3;
    const EInvalidPhase: u64 = 4;
    const EWithdrawalNotAllowed: u64 = 5;
    const ENoBalance: u64 = 6;
    const EInsufficientPayment: u64 = 7;
    const EInsufficientTreasury: u64 = 8;

    /// Launch phases - 4-phase lifecycle
    const PHASE_LAUNCH: u8 = 0;      // Fair-launch rules apply
    const PHASE_PRIVATE: u8 = 1;     // Session-based private accumulation
    const PHASE_SETTLEMENT: u8 = 2;  // Sessions close, balances applied
    const PHASE_OPEN: u8 = 3;        // Normal public token behavior

    /// A MemeToken with embedded launch rules and SUI treasury
    public struct MemeToken has key, store {
        id: UID,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        circulating_supply: u64,
        max_buy_per_wallet: u64,
        early_phase_duration_ms: u64,  // Duration for LAUNCH phase only
        phase_duration_ms: u64,         // Duration for PRIVATE, SETTLEMENT, etc.
        transfers_locked: bool,
        current_phase: u8,
        launch_time: u64,
        creator: address,
        holder_count: u64, // Track number of unique holders (public)
        total_volume: u64, // Track total trading volume (public)
        pending_holder_count: u64, // New holders during PRIVATE phase (hidden)
        pending_volume: u64, // Volume during PRIVATE phase (hidden)
        // Balance tracking
        balances: Table<address, u64>,
        purchases: Table<address, u64>, // Track purchases for max buy enforcement
        // SUI Treasury - stores all SUI from buys, pays out on sells
        treasury: Balance<SUI>,
    }

    /// Events
    public struct TokenLaunched has copy, drop {
        token_id: ID,
        token_name: String,
        creator: address,
        total_supply: u64,
        max_buy: u64,
    }

    public struct PurchaseMade has copy, drop {
        token_id: ID,
        buyer: address,
        token_amount: u64,
        sui_paid: u64,
        total_bought: u64,
    }

    public struct TokensSold has copy, drop {
        token_id: ID,
        seller: address,
        token_amount: u64,
        sui_received: u64,
    }

    public struct Transfer has copy, drop {
        token_id: ID,
        from: address,
        to: address,
        amount: u64,
    }

    public struct PhaseChanged has copy, drop {
        token_id: ID,
        token_name: String,
        old_phase: u8,
        new_phase: u8,
        timestamp: u64,
    }

    public struct TokenWithdrawn has copy, drop {
        token_id: ID,
        user: address,
        amount: u64,
        remaining_balance: u64,
    }

    /// Launch a new token
    public entry fun launch_token(
        clock: &Clock,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        total_supply: u64,
        max_buy_per_wallet: u64,
        early_phase_duration_ms: u64,  // Duration for LAUNCH phase (e.g., 3 minutes)
        phase_duration_ms: u64,         // Duration for PRIVATE/SETTLEMENT phases (e.g., 6 minutes)
        transfers_locked: bool,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let launch_time = clock::timestamp_ms(clock);
        
        let uid = object::new(ctx);
        let token_id = object::uid_to_inner(&uid);

        let token = MemeToken {
            id: uid,
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            decimals,
            total_supply,
            circulating_supply: 0,
            max_buy_per_wallet,
            early_phase_duration_ms,
            phase_duration_ms,
            transfers_locked,
            current_phase: PHASE_LAUNCH,
            launch_time,
            creator,
            holder_count: 0,
            total_volume: 0,
            pending_holder_count: 0,
            pending_volume: 0,
            balances: table::new(ctx),
            purchases: table::new(ctx),
            treasury: balance::zero<SUI>(), // Initialize empty treasury
        };

        // Emit launch event
        event::emit(TokenLaunched {
            token_id,
            token_name: token.name,
            creator,
            total_supply,
            max_buy: max_buy_per_wallet,
        });

        // Share the token object so anyone can interact with it
        transfer::share_object(token);
    }

    /// Buy tokens with SUI - uses bonding curve pricing
    /// User pays SUI, receives tokens based on current price
    /// SUI is stored in token's treasury for future sells
    public entry fun buy_tokens(
        clock: &Clock,
        token: &mut MemeToken,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Update phase if needed
        update_phase_internal(token, current_time);

        let payment_amount = coin::value(&payment);
        assert!(payment_amount > 0, EInsufficientPayment);

        // Calculate how many tokens buyer gets for their SUI
        // Using bonding curve: as supply increases, price per token increases
        let token_amount = calculate_tokens_for_sui(token, payment_amount);
        
        // Check if we have enough supply
        assert!(token.circulating_supply + token_amount <= token.total_supply, EInsufficientBalance);

        // Check max buy limit ONLY during LAUNCH and PRIVATE phases
        if (token.current_phase == PHASE_LAUNCH || token.current_phase == PHASE_PRIVATE) {
            let current_purchased = if (table::contains(&token.purchases, buyer)) {
                *table::borrow(&token.purchases, buyer)
            } else {
                0
            };
            
            let new_total = current_purchased + token_amount;
            assert!(new_total <= token.max_buy_per_wallet, EExceedsMaxBuy);

            // Update purchase tracking
            if (table::contains(&token.purchases, buyer)) {
                let purchase_ref = table::borrow_mut(&mut token.purchases, buyer);
                *purchase_ref = new_total;
            } else {
                table::add(&mut token.purchases, buyer, new_total);
            };
        };

        // Add SUI payment to treasury
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut token.treasury, payment_balance);

        // Update balance
        if (table::contains(&token.balances, buyer)) {
            let balance_ref = table::borrow_mut(&mut token.balances, buyer);
            *balance_ref = *balance_ref + token_amount;
        } else {
            table::add(&mut token.balances, buyer, token_amount);
            
            // Track holder count
            if (token.current_phase == PHASE_PRIVATE) {
                token.pending_holder_count = token.pending_holder_count + 1;
            } else {
                token.holder_count = token.holder_count + 1;
            };
        };

        // Update circulating supply
        token.circulating_supply = token.circulating_supply + token_amount;
        
        // Track volume
        if (token.current_phase == PHASE_PRIVATE) {
            token.pending_volume = token.pending_volume + token_amount;
        } else {
            token.total_volume = token.total_volume + token_amount;
        };

        // Emit event (skip during PRIVATE phase for privacy)
        if (token.current_phase != PHASE_PRIVATE) {
            let total_bought = if (table::contains(&token.purchases, buyer)) {
                *table::borrow(&token.purchases, buyer)
            } else {
                token_amount
            };

            event::emit(PurchaseMade {
                token_id: object::uid_to_inner(&token.id),
                buyer,
                token_amount,
                sui_paid: payment_amount,
                total_bought,
            });
        };
    }

    /// Sell tokens back to the bonding curve for SUI
    /// Tokens are burned, SUI is paid from treasury
    public entry fun sell_tokens(
        clock: &Clock,
        token: &mut MemeToken,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Update phase if needed
        update_phase_internal(token, current_time);

        // Check seller has balance
        assert!(table::contains(&token.balances, seller), ENoBalance);
        let seller_balance = {
            let balance = table::borrow(&token.balances, seller);
            *balance
        };
        assert!(seller_balance >= amount, EInsufficientBalance);

        // Calculate SUI to return using bonding curve
        let sui_to_return = calculate_sui_for_tokens(token, amount);
        
        // Check treasury has enough SUI
        assert!(balance::value(&token.treasury) >= sui_to_return, EInsufficientTreasury);

        // Burn tokens from seller's balance
        let balance_ref = table::borrow_mut(&mut token.balances, seller);
        *balance_ref = *balance_ref - amount;

        // Reduce circulating supply
        token.circulating_supply = token.circulating_supply - amount;

        // Pay seller from treasury
        let payment = coin::take(&mut token.treasury, sui_to_return, ctx);
        transfer::public_transfer(payment, seller);

        // Update volume
        if (token.current_phase == PHASE_PRIVATE) {
            token.pending_volume = token.pending_volume + amount;
        } else {
            token.total_volume = token.total_volume + amount;
        };

        // Emit event (skip during PRIVATE phase)
        if (token.current_phase != PHASE_PRIVATE) {
            event::emit(TokensSold {
                token_id: object::uid_to_inner(&token.id),
                seller,
                token_amount: amount,
                sui_received: sui_to_return,
            });
        };
    }

    /// Calculate how many tokens buyer gets for their SUI payment
    /// Uses integral of bonding curve: token_amount = sqrt(2 * treasury_delta / k + supply^2) - supply
    /// Simplified linear approximation for easier math
    fun calculate_tokens_for_sui(token: &MemeToken, sui_amount: u64): u64 {
        // Base price: 0.0001 SUI (100,000 MIST) per FULL token (not per base unit!)
        // With 9 decimals, 1 token = 1,000,000,000 base units
        let base_price: u64 = 100000; // MIST per full token
        let decimals_factor: u64 = 1000000000; // 10^9 for 9 decimals
        
        // Linear bonding curve: price increases with supply
        // price = base_price * (1 + supply_percent)
        let current_price = get_current_price(token);
        
        // Calculate tokens in base units
        // token_base_units = (sui_amount * decimals_factor) / price_per_full_token
        if (current_price == 0) {
            return ((sui_amount * decimals_factor) / base_price)
        };
        
        (sui_amount * decimals_factor) / current_price
    }

    /// Calculate how much SUI seller gets for their tokens
    /// Uses same bonding curve in reverse
    fun calculate_sui_for_tokens(token: &MemeToken, token_amount: u64): u64 {
        // Get price at current supply level (before sell)
        let current_price = get_current_price(token);
        let decimals_factor: u64 = 1000000000; // 10^9 for 9 decimals
        
        if (current_price == 0) {
            return 0
        };
        
        // sui_amount = (token_base_units * price_per_full_token) / decimals_factor
        // Simple calculation - in reality, price would decrease as we sell
        // This is approximate - could improve with integration
        (token_amount * current_price) / decimals_factor
    }

    /// Transfer tokens between addresses
    public entry fun transfer_token(
        token: &mut MemeToken,
        recipient: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // Check if transfers are locked
        assert!(!token.transfers_locked || token.current_phase == PHASE_OPEN, ETransfersLocked);

        // Check sender balance
        assert!(table::contains(&token.balances, sender), EInsufficientBalance);
        let sender_balance = table::borrow_mut(&mut token.balances, sender);
        assert!(*sender_balance >= amount, EInsufficientBalance);

        // Deduct from sender
        *sender_balance = *sender_balance - amount;

        // Add to recipient
        if (table::contains(&token.balances, recipient)) {
            let recipient_balance = table::borrow_mut(&mut token.balances, recipient);
            *recipient_balance = *recipient_balance + amount;
        } else {
            table::add(&mut token.balances, recipient, amount);
        };

        // Emit event
        event::emit(Transfer {
            token_id: object::uid_to_inner(&token.id),
            from: sender,
            to: recipient,
            amount,
        });
    }

    /// Manually advance phase (can be called by anyone)
    public entry fun advance_phase(
        clock: &Clock,
        token: &mut MemeToken,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        update_phase_internal(token, current_time);
    }

    /// Internal function to update phase based on time
    fun update_phase_internal(token: &mut MemeToken, current_time: u64) {
        let time_elapsed = current_time - token.launch_time;
        let early_duration = token.early_phase_duration_ms;
        let phase_duration = token.phase_duration_ms;

        // Simplified 3-phase system (instant settlement):
        // LAUNCH: 0 to early_duration (e.g., 0-3 min)
        // PRIVATE: early_duration to early_duration + phase_duration (e.g., 3-9 min) 
        // OPEN: after early_duration + phase_duration (e.g., 9+ min) - instant settlement, goes directly to public
        let should_be_phase = if (time_elapsed < early_duration) {
            PHASE_LAUNCH
        } else if (time_elapsed < early_duration + phase_duration) {
            PHASE_PRIVATE
        } else {
            PHASE_OPEN // Instant settlement - skip PHASE_SETTLEMENT
        };

        if (should_be_phase != token.current_phase) {
            let old_phase = token.current_phase;
            
            // If exiting PRIVATE phase, settle pending stats
            if (old_phase == PHASE_PRIVATE && should_be_phase != PHASE_PRIVATE) {
                token.holder_count = token.holder_count + token.pending_holder_count;
                token.total_volume = token.total_volume + token.pending_volume;
                token.pending_holder_count = 0;
                token.pending_volume = 0;
            };
            
            token.current_phase = should_be_phase;

            event::emit(PhaseChanged {
                token_id: object::uid_to_inner(&token.id),
                token_name: token.name,
                old_phase,
                new_phase: should_be_phase,
                timestamp: current_time,
            });
        }
    }

    /// Get token balance for an address
    public fun get_balance(token: &MemeToken, addr: address): u64 {
        if (table::contains(&token.balances, addr)) {
            *table::borrow(&token.balances, addr)
        } else {
            0
        }
    }

    /// Get wallet's total purchases
    public fun get_purchases(token: &MemeToken, addr: address): u64 {
        if (table::contains(&token.purchases, addr)) {
            *table::borrow(&token.purchases, addr)
        } else {
            0
        }
    }

    /// Get current phase
    public fun get_phase(token: &MemeToken): u8 {
        token.current_phase
    }

    /// Get token info
    public fun get_token_info(token: &MemeToken): (String, String, u8, u64, u64) {
        (token.name, token.symbol, token.decimals, token.total_supply, token.circulating_supply)
    }

    /// Get holder count
    public fun get_holder_count(token: &MemeToken): u64 {
        token.holder_count
    }

    /// Get total volume
    public fun get_total_volume(token: &MemeToken): u64 {
        token.total_volume
    }

    /// Get treasury balance (total SUI in bonding curve)
    public fun get_treasury_balance(token: &MemeToken): u64 {
        balance::value(&token.treasury)
    }

    /// Calculate current token price using linear bonding curve
    /// Price = base_price + (price_increment * circulating_supply / total_supply)
    /// This creates a linear price increase as more tokens are sold
    /// Get current token price based on bonding curve
    /// Returns price in MIST per FULL token (not per base unit)
    /// With 9 decimals, this means price for 1,000,000,000 base units
    public fun get_current_price(token: &MemeToken): u64 {
        // Base price: 0.0001 SUI (100,000 MIST) per full token
        let base_price: u64 = 100000;
        
        // Maximum price multiplier at 100% supply: 100x base price
        let max_multiplier: u64 = 100;
        
        if (token.total_supply == 0) {
            return base_price
        };
        
        // Calculate price multiplier based on circulating supply percentage
        // multiplier = 1 + (max_multiplier - 1) * (circulating / total)
        let supply_percent = (token.circulating_supply * 10000) / token.total_supply; // scaled by 10000
        let price_multiplier = 10000 + ((max_multiplier - 1) * supply_percent); // 10000 = 1x
        
        // price = base_price * price_multiplier / 10000
        (base_price * price_multiplier) / 10000
    }


    /// Withdraw tokens to wallet as Sui Coins
    /// Only available during OPEN phase (phase 3)
    /// Converts platform balance to wrapped Coin<WRAPPED_TOKEN> objects
    public entry fun withdraw_to_wallet(
        clock: &Clock,
        token: &mut MemeToken,
        treasury_cap: &mut TreasuryCap<WRAPPED_TOKEN>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Update phase if needed
        update_phase_internal(token, current_time);

        // Only allow withdrawals during OPEN phase (phase 3)
        assert!(token.current_phase == PHASE_OPEN, EWithdrawalNotAllowed);

        // Check user has balance
        assert!(table::contains(&token.balances, sender), ENoBalance);
        let balance = table::borrow_mut(&mut token.balances, sender);
        assert!(*balance >= amount, EInsufficientBalance);

        // Reduce platform balance
        *balance = *balance - amount;
        let remaining = *balance;

        // Mint wrapped token and send to user's wallet
        let coin = wrapped_token::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, sender);

        // Emit event
        event::emit(TokenWithdrawn {
            token_id: object::uid_to_inner(&token.id),
            user: sender,
            amount,
            remaining_balance: remaining,
        });
    }

    /// Deposit wrapped tokens back to platform balance
    /// Allows users to move tokens from wallet back to platform
    public entry fun deposit_from_wallet(
        clock: &Clock,
        token: &mut MemeToken,
        treasury_cap: &mut TreasuryCap<WRAPPED_TOKEN>,
        coin: Coin<WRAPPED_TOKEN>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // Update phase if needed
        update_phase_internal(token, current_time);

        let amount = coin::value(&coin);

        // Burn the wrapped coin
        wrapped_token::burn(treasury_cap, coin);

        // Add to platform balance
        if (table::contains(&token.balances, sender)) {
            let balance = table::borrow_mut(&mut token.balances, sender);
            *balance = *balance + amount;
        } else {
            table::add(&mut token.balances, sender, amount);
            token.holder_count = token.holder_count + 1;
        };
    }
    /// Calculate market cap (circulating_supply * current_price)
    public fun get_market_cap(token: &MemeToken): u64 {
        let price = get_current_price(token);
        // Scale down to avoid overflow: (circulating_supply / 10^9) * price
        let supply_scaled = token.circulating_supply / 1_000_000_000; // Convert from smallest unit
        supply_scaled * price
    }
}
