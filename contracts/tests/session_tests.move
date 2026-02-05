#[test_only]
module memefi::session_tests {
    use memefi::session::{Self, TradingSession};
    use sui::test_scenario;
    use std::string;

    public struct TESTCOIN has drop {}

    #[test]
    fun test_session_creation() {
        let creator = @0xA;
        
        let mut scenario = test_scenario::begin(creator);
        {
            session::create_session<TESTCOIN>(
                b"Test Session",
                b"TestCoin",
                3600000,  // 1 hour
                test_scenario::ctx(&mut scenario)
            );
        };

        // Check session created
        test_scenario::next_tx(&mut scenario, creator);
        {
            assert!(test_scenario::has_most_recent_shared<TradingSession<TESTCOIN>>(), 0);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_join_and_trade() {
        let creator = @0xA;
        let trader = @0xB;
        
        let mut scenario = test_scenario::begin(creator);
        
        // Create session
        {
            session::create_session<TESTCOIN>(
                b"Trade Session",
                b"TestCoin",
                3600000,
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::next_tx(&mut scenario, creator);
        let mut session = test_scenario::take_shared<TradingSession<TESTCOIN>>(&scenario);

        // Trader joins
        test_scenario::next_tx(&mut scenario, trader);
        {
            session::join_session(
                &mut session,
                b"anon42.session.memefi.eth",
                test_scenario::ctx(&mut scenario)
            );
        };

        // Trader buys
        test_scenario::next_tx(&mut scenario, trader);
        {
            session::buy_in_session(
                &mut session,
                1000,
                test_scenario::ctx(&mut scenario)
            );
        };

        // Check balance
        test_scenario::next_tx(&mut scenario, trader);
        {
            let balance = session::get_balance(&session, trader, test_scenario::ctx(&mut scenario));
            assert!(balance == 1000, 0);
        };

        // Check volume
        {
            let volume = session::get_volume(&session);
            assert!(volume == 1000, 1);
        };

        test_scenario::return_shared(session);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_privacy() {
        let creator = @0xA;
        let trader1 = @0xB;
        let trader2 = @0xC;
        
        let mut scenario = test_scenario::begin(creator);
        
        {
            session::create_session<TESTCOIN>(
                b"Private Session",
                b"TestCoin",
                3600000,
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::next_tx(&mut scenario, creator);
        let mut session = test_scenario::take_shared<TradingSession<TESTCOIN>>(&scenario);

        // Trader 1 joins and buys
        test_scenario::next_tx(&mut scenario, trader1);
        {
            session::join_session(&mut session, b"anon1.memefi.eth", test_scenario::ctx(&mut scenario));
            session::buy_in_session(&mut session, 500, test_scenario::ctx(&mut scenario));
        };

        // Trader 2 tries to see trader 1's balance
        test_scenario::next_tx(&mut scenario, trader2);
        {
            let balance = session::get_balance(&session, trader1, test_scenario::ctx(&mut scenario));
            // Should return 0 because trader2 can't see trader1's balance
            assert!(balance == 0, 0);
        };

        // Trader 1 can see their own balance
        test_scenario::next_tx(&mut scenario, trader1);
        {
            let balance = session::get_balance(&session, trader1, test_scenario::ctx(&mut scenario));
            assert!(balance == 500, 1);
        };

        test_scenario::return_shared(session);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = session::EInsufficientBalance)]
    fun test_insufficient_balance() {
        let creator = @0xA;
        let trader = @0xB;
        
        let mut scenario = test_scenario::begin(creator);
        
        {
            session::create_session<TESTCOIN>(
                b"Test Session",
                b"TestCoin",
                3600000,
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::next_tx(&mut scenario, creator);
        let mut session = test_scenario::take_shared<TradingSession<TESTCOIN>>(&scenario);

        test_scenario::next_tx(&mut scenario, trader);
        {
            session::join_session(&mut session, b"trader.memefi.eth", test_scenario::ctx(&mut scenario));
        };

        // Try to sell without balance
        test_scenario::next_tx(&mut scenario, trader);
        {
            session::sell_in_session(
                &mut session,
                100,
                test_scenario::ctx(&mut scenario)
            );
        };

        test_scenario::return_shared(session);
        test_scenario::end(scenario);
    }
}
