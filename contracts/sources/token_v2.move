/// MemeFi Token Module V2
/// Simplified token system for fair launch platform
/// Uses custom balance tracking instead of Sui Coin for easier dynamic token creation
module memefi::token_v2 {
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    /// Errors
    const EExceedsMaxBuy: u64 = 1;
    const ETransfersLocked: u64 = 2;
    const EInsufficientBalance: u64 = 3;
    const EInvalidPhase: u64 = 4;

    /// Launch phases - 4-phase lifecycle
    const PHASE_LAUNCH: u8 = 0;      // Fair-launch rules apply
    const PHASE_PRIVATE: u8 = 1;     // Session-based private accumulation
    const PHASE_SETTLEMENT: u8 = 2;  // Sessions close, balances applied
    const PHASE_OPEN: u8 = 3;        // Normal public token behavior

    /// A MemeToken with embedded launch rules
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
        amount: u64,
        total_bought: u64,
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

    /// Buy tokens - enforces max buy rules and phase restrictions
    /// During PRIVATE phase, purchases are accumulated privately (no balance update)
    /// During other phases, balances are updated immediately
    public entry fun buy_tokens(
        clock: &Clock,
        token: &mut MemeToken,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Update phase if needed
        update_phase_internal(token, current_time);

        // Check if we have enough supply
        assert!(token.circulating_supply + amount <= token.total_supply, EInsufficientBalance);

        // Check max buy limit ONLY during LAUNCH and PRIVATE phases
        // After private session ends (SETTLEMENT/OPEN), no restrictions
        if (token.current_phase == PHASE_LAUNCH || token.current_phase == PHASE_PRIVATE) {
            let current_purchased = if (table::contains(&token.purchases, buyer)) {
                *table::borrow(&token.purchases, buyer)
            } else {
                0
            };
            
            let new_total = current_purchased + amount;
            assert!(new_total <= token.max_buy_per_wallet, EExceedsMaxBuy);

            // Update purchase tracking
            if (table::contains(&token.purchases, buyer)) {
                let purchase_ref = table::borrow_mut(&mut token.purchases, buyer);
                *purchase_ref = new_total;
            } else {
                table::add(&mut token.purchases, buyer, new_total);
            };
        };

        // Update balance immediately for ALL phases
        // Privacy is maintained by not emitting events AND not updating public stats during PRIVATE phase
        let is_new_holder = !table::contains(&token.balances, buyer);
        
        if (table::contains(&token.balances, buyer)) {
            let balance_ref = table::borrow_mut(&mut token.balances, buyer);
            *balance_ref = *balance_ref + amount;
        } else {
            table::add(&mut token.balances, buyer, amount);
            
            // Track holder count: use pending during PRIVATE, else update public
            if (token.current_phase == PHASE_PRIVATE) {
                token.pending_holder_count = token.pending_holder_count + 1;
            } else {
                token.holder_count = token.holder_count + 1;
            };
        };

        // Update circulating supply (always immediate)
        token.circulating_supply = token.circulating_supply + amount;
        
        // Track volume: use pending during PRIVATE, else update public
        if (token.current_phase == PHASE_PRIVATE) {
            token.pending_volume = token.pending_volume + amount;
        } else {
            token.total_volume = token.total_volume + amount;
        };

        // Emit event only for non-private phases (maintain privacy during PRIVATE phase)
        if (token.current_phase != PHASE_PRIVATE) {
            let total_bought = if (table::contains(&token.purchases, buyer)) {
                *table::borrow(&token.purchases, buyer)
            } else {
                amount
            };

            event::emit(PurchaseMade {
                token_id: object::uid_to_inner(&token.id),
                buyer,
                amount,
                total_bought,
            });
        };
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

    /// Calculate current token price using linear bonding curve
    /// Price = base_price + (price_increment * circulating_supply / total_supply)
    /// This creates a linear price increase as more tokens are sold
    public fun get_current_price(token: &MemeToken): u64 {
        // Base price: 0.0001 SOL (100000 MIST with 9 decimals)
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

    /// Calculate market cap (circulating_supply * current_price)
    public fun get_market_cap(token: &MemeToken): u64 {
        let price = get_current_price(token);
        // Scale down to avoid overflow: (circulating_supply / 10^9) * price
        let supply_scaled = token.circulating_supply / 1_000_000_000; // Convert from smallest unit
        supply_scaled * price
    }
}
