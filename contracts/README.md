# MemeFi Smart Contracts

Sui Move smart contracts for the MemeFi fair launch protocol.

## 📦 Modules

### 1. **token.move** - Fair Launch Token
- Create tokens with embedded launch rules
- Enforce max buy per wallet
- Phase-based trading restrictions
- Automatic phase transitions

### 2. **session.move** - Private Trading Sessions
- Create time-limited trading sessions
- Private balance tracking
- ENS identity integration
- Delayed settlement mechanism

## 🏗️ Architecture

```
LaunchRules
├── token_name: String
├── total_supply: u64
├── max_buy_per_wallet: u64
├── phase_duration_ms: u64
├── transfers_locked: bool
└── current_phase: u8

TradingSession
├── session_name: String
├── participants: vector<address>
├── balances: Table<address, u64>  // Private
├── identities: Table<address, String>  // ENS
├── volume: u64
└── state: u8
```

## 🚀 Building

```bash
sui move build
```

## 🧪 Testing

```bash
sui move test
```

## 📝 Deployment

```bash
# Initialize Sui client
sui client

# Deploy to devnet
sui client publish --gas-budget 100000000

# Save the package ID for frontend integration
```

## 🔧 Key Functions

### Token Module

```move
// Create a new token with rules
create_token(name, symbol, supply, max_buy, phase_duration, transfers_locked)

// Buy tokens (enforces max buy)
buy_tokens(rules, registry, amount)

// Advance to next phase
advance_phase(rules)

// Check transfer validity
can_transfer(rules, from, to)
```

### Session Module

```move
// Create trading session
create_session(name, token_name, duration)

// Join with ENS identity
join_session(session, ens_name)

// Trade within session
buy_in_session(session, amount)
sell_in_session(session, amount)

// Settlement
end_session(session)
settle_session(session)
```

## 🔐 Security Features

- **Max Buy Enforcement**: Prevents whale manipulation
- **Phase-Based Restrictions**: Gradual unlocking of features
- **Private Balances**: Session trades hidden until settlement
- **Time-Locked Transfers**: Configurable transfer restrictions

## 📊 Events

- `TokenLaunched`: Emitted on token creation
- `PurchaseMade`: Tracks all token purchases
- `PhaseChanged`: Logs phase transitions
- `SessionCreated`: New session initialized
- `TradeExecuted`: Records session trades
- `SessionSettled`: Final settlement complete

## 🔗 Integration

See frontend integration guide in `../memefi-frontend/README.md`

## 📄 License

MIT
