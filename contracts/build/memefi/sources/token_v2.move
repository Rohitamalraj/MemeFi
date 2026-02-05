/// MemeFi Token Module V2
/// Simplified token system for fair launch platform
/// Uses custom balance tracking instead of Sui Coin for easier dynamic token creation
module memefi::token_v2 {
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};

    /// Errors
    const EExceedsMaxBuy: u64 = 1;
    const ETransfersLocked: u64 = 2;
    const EInsufficientBalance: u64 = 3;
    const EInvalidPhase: u64 = 4;

    /// Launch phases
    const PHASE_LAUNCH: u8 = 0;
    const PHASE_PUBLIC: u8 = 1;
    const PHASE_OPEN: u8 = 2;

    /// A MemeToken with embedded launch rules
    public struct MemeToken has key, store {
        id: UID,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        circulating_supply: u64,
        max_buy_per_wallet: u64,
        phase_duration_ms: u64,
        transfers_locked: bool,
        current_phase: u8,
        launch_time: u64,
        creator: address,
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
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        total_supply: u64,
        max_buy_per_wallet: u64,
        phase_duration_ms: u64,
        transfers_locked: bool,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let launch_time = tx_context::epoch_timestamp_ms(ctx);
        
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
            phase_duration_ms,
            transfers_locked,
            current_phase: PHASE_LAUNCH,
            launch_time,
            creator,
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
    public entry fun buy_tokens(
        token: &mut MemeToken,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let current_time = tx_context::epoch_timestamp_ms(ctx);

        // Update phase if needed
        update_phase_internal(token, current_time);

        // Check if we have enough supply
        assert!(token.circulating_supply + amount <= token.total_supply, EInsufficientBalance);

        // Check max buy limit during launch and public phases
        if (token.current_phase != PHASE_OPEN) {
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

        // Update balance
        if (table::contains(&token.balances, buyer)) {
            let balance_ref = table::borrow_mut(&mut token.balances, buyer);
            *balance_ref = *balance_ref + amount;
        } else {
            table::add(&mut token.balances, buyer, amount);
        };

        // Update circulating supply
        token.circulating_supply = token.circulating_supply + amount;

        let total_bought = if (table::contains(&token.purchases, buyer)) {
            *table::borrow(&token.purchases, buyer)
        } else {
            amount
        };

        // Emit event
        event::emit(PurchaseMade {
            token_id: object::uid_to_inner(&token.id),
            buyer,
            amount,
            total_bought,
        });
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
        token: &mut MemeToken,
        ctx: &mut TxContext
    ) {
        let current_time = tx_context::epoch_timestamp_ms(ctx);
        update_phase_internal(token, current_time);
    }

    /// Internal function to update phase based on time
    fun update_phase_internal(token: &mut MemeToken, current_time: u64) {
        let time_elapsed = current_time - token.launch_time;
        let phase_duration = token.phase_duration_ms;

        let should_be_phase = if (time_elapsed < phase_duration) {
            PHASE_LAUNCH
        } else if (time_elapsed < phase_duration * 2) {
            PHASE_PUBLIC
        } else {
            PHASE_OPEN
        };

        if (should_be_phase != token.current_phase) {
            let old_phase = token.current_phase;
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
}
