#[test_only]
module memefi::token_tests {
    use memefi::token::{Self, LaunchRules, WalletRegistry};
    use sui::test_scenario;
    use std::string;

    #[test]
    fun test_token_creation() {
        let creator = @0xA;
        
        let mut scenario = test_scenario::begin(creator);
        {
            token::create_token(
                b"DogeCoin",
                b"DOGE",
                1000000000,  // 1B supply
                10000,       // max 10k per wallet
                86400000,    // 24hr phases
                true,        // transfers locked
                test_scenario::ctx(&mut scenario)
            );
        };

        // Check rules object created
        test_scenario::next_tx(&mut scenario, creator);
        {
            assert!(test_scenario::has_most_recent_for_sender<LaunchRules>(&scenario), 0);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_buy_enforcement() {
        let creator = @0xA;
        let buyer = @0xB;
        
        let mut scenario = test_scenario::begin(creator);
        
        // Create token
        {
            token::create_token(
                b"TestCoin",
                b"TEST",
                1000000,
                5000,  // max 5000
                86400000,
                true,
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::next_tx(&mut scenario, creator);
        let mut rules = test_scenario::take_from_sender<LaunchRules>(&scenario);
        
        test_scenario::next_tx(&mut scenario, creator);
        let mut registry = test_scenario::take_shared<WalletRegistry>(&scenario);

        // Buyer tries to buy
        test_scenario::next_tx(&mut scenario, buyer);
        {
            token::buy_tokens(
                &rules,
                &mut registry,
                3000,
                test_scenario::ctx(&mut scenario)
            );
        };

        // Check purchase recorded
        test_scenario::next_tx(&mut scenario, buyer);
        {
            let bought = token::get_wallet_purchases(&registry, buyer);
            assert!(bought == 3000, 0);
        };

        test_scenario::return_to_sender(&scenario, rules);
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = token::EExceedsMaxBuy)]
    fun test_max_buy_exceeded() {
        let creator = @0xA;
        let buyer = @0xB;
        
        let mut scenario = test_scenario::begin(creator);
        
        {
            token::create_token(
                b"TestCoin",
                b"TEST",
                1000000,
                5000,
                86400000,
                true,
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::next_tx(&mut scenario, creator);
        let mut rules = test_scenario::take_from_sender<LaunchRules>(&scenario);
        
        test_scenario::next_tx(&mut scenario, creator);
        let mut registry = test_scenario::take_shared<WalletRegistry>(&scenario);

        // Try to buy more than max
        test_scenario::next_tx(&mut scenario, buyer);
        {
            token::buy_tokens(
                &rules,
                &mut registry,
                6000,  // Exceeds max of 5000
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::return_to_sender(&scenario, rules);
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }
}
