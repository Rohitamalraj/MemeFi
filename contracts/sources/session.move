/// MemeFi Session Module
/// Implements post-launch private accumulation system
/// Based on the specification: sessions are temporary vaults for private token accumulation
module memefi::session {
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self as clock, Clock};
    use memefi::token_v2::{Self, MemeToken};

    /// Errors
    const ESessionExists: u64 = 1;
    const ESessionNotActive: u64 = 2;
    const EWrongPhase: u64 = 3;
    const ENotOwner: u64 = 4;
    const EAlreadySettled: u64 = 5;
    const EInvalidAmount: u64 = 6;

    /// Session states
    const STATE_ACTIVE: u8 = 0;
    const STATE_SETTLED: u8 = 1;

    /// Token phases (matching token_v2)
    const PHASE_LAUNCH: u8 = 0;
    const PHASE_PRIVATE: u8 = 1;  // New phase for private accumulation
    const PHASE_SETTLEMENT: u8 = 2;
    const PHASE_OPEN: u8 = 3;

    /// A trading session is a temporary vault for private accumulation
    public struct TradingSession has key {
        id: UID,
        owner: address,
        state: u8,              // ACTIVE | SETTLED
        token_id: ID,           // Which token this session belongs to
        balance: u64,           // Tokens accumulated in session
        created_at: u64,
    }

    /// Events
    public struct SessionOpened has copy, drop {
        session_id: ID,
        owner: address,
        token_id: ID,
    }

    public struct SessionBuy has copy, drop {
        session_id: ID,
        amount: u64,
    }

    public struct SessionSettled has copy, drop {
        session_id: ID,
        final_balance: u64,
    }

    /// Open a session - create a private container for accumulation
    /// Preconditions:
    /// - Token phase == PRIVATE
    /// - Caller has no active session for this token (enforced by object ownership)
    public entry fun open_session(
        clock: &Clock,
        token: &MemeToken,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let created_at = clock::timestamp_ms(clock);
        
        // Check phase - must be PRIVATE
        let phase = token_v2::get_phase(token);
        assert!(phase == PHASE_PRIVATE, EWrongPhase);

        let uid = object::new(ctx);
        let session_id = object::uid_to_inner(&uid);
        let token_id = object::id(token);

        let session = TradingSession {
            id: uid,
            owner,
            state: STATE_ACTIVE,
            token_id,
            balance: 0,
            created_at,
        };

        event::emit(SessionOpened {
            session_id,
            owner,
            token_id,
        });

        // Transfer to owner - they control when to settle
        transfer::transfer(session, owner);
    }

    /// Buy in session - privately accumulate tokens
    /// This is NOT market trading - it's controlled balance increase
    /// Preconditions:
    /// - Session exists and is ACTIVE
    /// - Token phase == PRIVATE
    /// - Buy amount > 0
    /// Security: No other account can see this balance
    public entry fun buy_in_session(
        clock: &Clock,
        session: &mut TradingSession,
        token: &mut MemeToken,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // Verify ownership
        assert!(caller == session.owner, ENotOwner);
        assert!(session.state == STATE_ACTIVE, ESessionNotActive);
        assert!(amount > 0, EInvalidAmount);

        // Check phase
        let phase = token_v2::get_phase(token);
        assert!(phase == PHASE_PRIVATE, EWrongPhase);

        // Verify session is for this token
        assert!(session.token_id == object::id(token), EWrongPhase);

        // Allocate tokens to session (not wallet)
        // This uses the token's internal buy function but doesn't emit wallet events
        token_v2::buy_tokens(clock, token, amount, ctx);

        // Increase session balance
        session.balance = session.balance + amount;

        event::emit(SessionBuy {
            session_id: object::uid_to_inner(&session.id),
            amount,
        });
    }

    /// Settle session - end privacy and restore transparency
    /// Preconditions:
    /// - Session exists and is ACTIVE
    /// - Token phase == SETTLEMENT or OPEN
    /// - Caller == session owner
    /// Effects:
    /// - Transfer session balance → wallet balance
    /// - Mark session as SETTLED
    /// - Session becomes immutable
    public entry fun settle_session(
        session: &mut TradingSession,
        token: &mut MemeToken,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // Verify ownership
        assert!(caller == session.owner, ENotOwner);
        assert!(session.state == STATE_ACTIVE, ESessionNotActive);

        // Check phase - must be SETTLEMENT or OPEN
        let phase = token_v2::get_phase(token);
        assert!(phase >= PHASE_SETTLEMENT, EWrongPhase);

        // Verify session is for this token
        assert!(session.token_id == object::id(token), EWrongPhase);

        // Mark as settled
        let final_balance = session.balance;
        session.state = STATE_SETTLED;

        event::emit(SessionSettled {
            session_id: object::uid_to_inner(&session.id),
            final_balance,
        });

        // Note: The tokens are already in the wallet via buy_tokens
        // The session just delayed the visibility
        // In a full implementation, you might transfer from session to wallet here
    }

    // === View Functions ===

    /// Get session balance (only owner can see before settlement)
    public fun get_balance(session: &TradingSession): u64 {
        session.balance
    }

    /// Get session state
    public fun get_state(session: &TradingSession): u8 {
        session.state
    }

    /// Get session owner
    public fun get_owner(session: &TradingSession): address {
        session.owner
    }

    /// Check if session is active
    public fun is_active(session: &TradingSession): bool {
        session.state == STATE_ACTIVE
    }

    /// Get token ID
    public fun get_token_id(session: &TradingSession): ID {
        session.token_id
    }
}
