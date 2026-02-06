/// MemeFi Wrapped Token Module
/// Allows users to withdraw their platform balances as standard Sui Coins
/// All memecoins use this wrapped token type for wallet compatibility
module memefi::wrapped_token {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url;

    /// One-Time-Witness for the wrapped token
    public struct WRAPPED_TOKEN has drop {}

    /// Initialize the wrapped token currency
    fun init(witness: WRAPPED_TOKEN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, // 9 decimals
            b"WMEME",
            b"Wrapped MemeFi Token",
            b"Platform-issued wrapped tokens representing memecoin balances",
            option::some(url::new_unsafe_from_bytes(b"https://memefi.xyz/icon.png")),
            ctx
        );
        
        // Share the treasury cap so token_v2 can mint wrapped coins
        transfer::public_share_object(treasury_cap);
        
        // Freeze metadata (standard practice)
        transfer::public_freeze_object(metadata);
    }

    /// Mint wrapped tokens (called by token_v2 module during withdrawal)
    public fun mint(
        treasury_cap: &mut TreasuryCap<WRAPPED_TOKEN>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<WRAPPED_TOKEN> {
        coin::mint(treasury_cap, amount, ctx)
    }

    /// Burn wrapped tokens (for potential deposit-back feature)
    public fun burn(
        treasury_cap: &mut TreasuryCap<WRAPPED_TOKEN>,
        coin: Coin<WRAPPED_TOKEN>
    ) {
        coin::burn(treasury_cap, coin);
    }
}
