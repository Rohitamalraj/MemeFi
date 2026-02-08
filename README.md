# MemeFi

**A Sui-native fair launch protocol for memecoins with privacy-aware early trading sessions.**

MemeFi solves premature transparency exploitation in DeFi token launches by enforcing fair distribution rules, hiding accumulation activity during a private phase, and restoring full transparency once open trading begins — all at the smart contract level.

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Architecture](#architecture)
- [Token Lifecycle](#token-lifecycle)
- [Smart Contracts](#smart-contracts)
- [Frontend](#frontend)
- [External Integrations](#external-integrations)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Problem

Current memecoin platforms suffer from two fundamental design flaws:

**Unfair Launches**
- Bots dominate early buys using automated scripts
- Insiders accumulate before public awareness
- "Fair launch" claims are UI-level only — no protocol enforcement

**Exploitable Transparency**
- On-chain balances are publicly queryable in real-time
- Whales track accumulator wallets and front-run their exits
- MEV bots extract value from every visible transaction
- Small participants get dumped on before they can react

DeFi's transparency is a feature — but **premature** transparency during token accumulation creates an extractive environment.

---

## Solution

MemeFi introduces a **three-phase token lifecycle** that separates fair distribution, private accumulation, and public trading into distinct protocol-enforced phases.

### Core Mechanisms

- **Move-enforced fair launch rules** — max buy per wallet, enforced at the contract level
- **Bonding curve pricing** — token price scales with circulating supply via a linear bonding curve backed by a real SUI treasury
- **Session-based private accumulation** — temporary vault objects hide individual positions during the PRIVATE phase
- **Event suppression** — purchase events and holder/volume metrics are withheld during PRIVATE, then revealed on phase transition
- **Instant settlement** — pending metrics merge into public state automatically when PRIVATE ends

> **Privacy during accumulation. Transparency during open trading.**

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         User                                     │
│              Sui Wallet            MetaMask (Sepolia)            │
└──────┬───────────────────────────────┬──────────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                               │
│  Launch Form │ Token Page │ Sessions │ Portfolio │ ENS Modal     │
│  Trading Chart (lightweight-charts) │ Wallet Mapping             │
└──────┬───────────┬──────────┬────────────┬──────────────────────┘
       │           │          │            │
       ▼           ▼          ▼            ▼
┌─────────────┐ ┌────────┐ ┌──────┐ ┌──────────────────┐
│ token_v2    │ │session │ │WMEME │ │ External Services │
│ .move       │ │.move   │ │.move │ │                  │
│             │ │        │ │      │ │ • Pyth Oracle    │
│ • Lifecycle │ │ • Vault│ │ • Mint│ │ • Walrus Storage │
│ • Bonding   │ │ • Buy  │ │ • Burn│ │ • ENS (Sepolia)  │
│ • Treasury  │ │ • Settle│ │      │ │                  │
│ • Balances  │ │        │ │      │ │                  │
└─────────────┘ └────────┘ └──────┘ └──────────────────┘
       └──────────────┘
        Sui Blockchain
         (Testnet)
```

---

## Token Lifecycle

Each token created on MemeFi progresses through three phases, with transitions driven by time using Sui's shared `Clock` object. Any user can call `advance_phase()` — no admin key required.

### Phase 1: LAUNCH

| Property | Detail |
|----------|--------|
| Duration | Configurable (e.g. 3 minutes) |
| Buying | Active via bonding curve |
| Max Buy | Enforced per wallet in Move |
| Events | Emitted publicly (`PurchaseMade`, `TokensSold`) |
| Metrics | `holder_count` and `total_volume` updated in public fields |

### Phase 2: PRIVATE

| Property | Detail |
|----------|--------|
| Duration | Configurable (e.g. 6 minutes) |
| Buying | Active via same bonding curve + max buy limits |
| Events | **Suppressed** — `PurchaseMade` and `TokensSold` not emitted |
| Metrics | New holders and volume stored in hidden `pending_holder_count` and `pending_volume` fields |
| Sessions | Users can open `TradingSession` vaults — owned objects where accumulation is invisible to others |

### Phase 3: OPEN

| Property | Detail |
|----------|--------|
| Duration | Permanent |
| Settlement | `pending_*` metrics atomically merged into public fields |
| Transfers | Unlocked |
| Withdrawals | Users convert platform balances to `Coin<WRAPPED_TOKEN>` (WMEME) via `withdraw_to_wallet()` |
| Trading | Full transparency — normal DeFi behavior |

---

## Smart Contracts

All contracts are written in **Move** and deployed on **Sui Testnet**.

**Package ID:** `0xea7d648351f216544ed0db53b51256490ab18e0d6965cebcfbc40abcae84a88b`

### `token_v2.move`

Core module managing the token lifecycle, pricing, and balances.

- **`MemeToken`** — shared object containing:
  - `Table<address, u64>` balance ledger
  - `Table<address, u64>` purchase tracker (for max buy enforcement)
  - `Balance<SUI>` treasury backing the bonding curve
  - Phase state, timing metadata, and pending metrics
- **Bonding Curve** — linear pricing: `price = base_price × (1 + (max_multiplier - 1) × circulating / total)`
  - Base price: 0.0001 SUI per token
  - Max multiplier: 100x at full supply
- **Key Functions:**
  - `launch_token()` — create and share a new MemeToken
  - `buy_tokens()` — purchase via bonding curve, SUI deposited to treasury
  - `sell_tokens()` — sell back to curve, SUI withdrawn from treasury
  - `transfer_token()` — transfer between addresses (OPEN phase only)
  - `advance_phase()` — permissionless phase advancement via Clock
  - `withdraw_to_wallet()` — mint WMEME coins from platform balance
  - `deposit_from_wallet()` — burn WMEME back to platform balance

### `session.move`

Private accumulation vaults for the PRIVATE phase.

- **`TradingSession`** — owned object transferred to the caller
  - Only the owner can read the session balance (Sui's ownership model = natural access control)
- **Key Functions:**
  - `open_session()` — create a session (PRIVATE phase only)
  - `buy_in_session()` — privately accumulate tokens through the bonding curve
  - `settle_session()` — finalize session (SETTLEMENT/OPEN phase only)

### `wrapped_token.move`

Wallet interoperability layer.

- **`WRAPPED_TOKEN`** — one-time witness for Sui Coin creation
- Shared `TreasuryCap` for cross-module minting/burning
- Enables users to hold tokens as standard `Coin` objects in their wallet

---

## Frontend

Built with **Next.js 16** (App Router) and **TypeScript**.

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, how-it-works, and 3D particle background |
| `/tokens` | Browse all launched tokens with price, phase, and market data |
| `/tokens/[id]` | Token detail page with trading chart, buy/sell, and session controls |
| `/launch` | Token creation form with image upload to Walrus |
| `/portfolio` | Holdings, P&L, transaction history, ENS registration |
| `/sessions` | Browse tokens in PRIVATE phase, manage sessions |
| `/dashboard` | Overview dashboard |

### Key Components

- **Trading Chart** — Real-time candlestick + volume charts using `lightweight-charts` with timeframe switching (1m/5m/15m/1H/1D) and USD/SUI toggle
- **ENS Registration Modal** — Full commit-reveal ENS registration on Ethereum Sepolia with MetaMask connect and chain switching
- **Wallet Button** — Sui wallet connection (Slush/Sui Wallet) with ENS name display
- **Portfolio Page** — Token holdings, investment breakdown pie chart, transaction history
- **Launch Form** — Token creation with configurable name, symbol, supply, max buy, phase durations, and Walrus image upload

### Hooks

- `use-ens-registration` — ENS commit-reveal flow (commit → 60s wait → register)
- `use-ens-name` — Resolve and display user's ENS name
- `use-wallet-mapping` — ENS → ETH → Sui address mapping
- `use-contracts` — Token launch, session management, phase advancement
- `use-chart-data` — Candlestick data generation from on-chain events
- `use-wallet` — Sui wallet connection and transaction execution

---

## External Integrations

### Pyth Network (Oracle)

- Real-time **SUI/USD price** from Hermes API (`/v2/updates/price/latest`)
- Feed ID: `0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266`
- Powers USD market cap calculations, portfolio valuation, and dual-currency chart display
- Fallback price: $1.50 if API unavailable

### Walrus (Decentralized Storage)

- Token logo images uploaded via HTTP PUT to Walrus testnet publisher (`/v1/blobs`)
- Returns `blobId` for retrieval through the Walrus aggregator
- Censorship-resistant, decentralized image hosting

### ENS (Ethereum Name Service)

- Registration on **Ethereum Sepolia** testnet
- Uses the official ETH Registrar Controller (`0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968`)
- Two-step commit-reveal: `commit` → 60 second wait → `register`
- After registration, maps ENS name → ETH address → Sui wallet address
- Creates a cross-chain identity layer for the Sui-native platform

---

## Project Structure

```
MemeFi/
├── contracts/                    # Move smart contracts
│   ├── Move.toml                 # Package manifest
│   ├── Published.toml            # Deployment metadata
│   ├── sources/
│   │   ├── token_v2.move         # Core token lifecycle + bonding curve
│   │   ├── session.move          # Private accumulation sessions
│   │   └── wrapped_token.move    # WMEME coin for wallet withdrawals
│   ├── tests/
│   │   ├── token_tests.move
│   │   └── session_tests.move
│   └── scripts/
│       ├── deploy.sh
│       └── deploy.ps1
│
├── frontend/                     # Next.js application
│   ├── app/                      # App Router pages
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── tokens/               # Token listing + detail pages
│   │   ├── launch/               # Token creation page
│   │   ├── portfolio/            # Portfolio & ENS page
│   │   ├── sessions/             # Session management page
│   │   └── dashboard/            # Dashboard page
│   ├── components/               # React components
│   │   ├── ens-registration-modal.tsx
│   │   ├── trading-chart.tsx
│   │   ├── launch-form.tsx
│   │   ├── portfolio-page.tsx
│   │   ├── sessions-page.tsx
│   │   ├── tokens-page.tsx
│   │   ├── wallet-button.tsx
│   │   ├── header.tsx
│   │   ├── hero.tsx
│   │   ├── gl/                   # 3D WebGL components
│   │   └── ui/                   # shadcn/ui primitives
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-ens-registration.ts
│   │   ├── use-ens-name.ts
│   │   └── use-wallet-mapping.ts
│   └── lib/                      # Utilities & services
│       ├── sui-client.ts         # Sui transaction builders
│       ├── contract-config.ts    # Contract addresses & ABIs
│       ├── price-feed.ts         # Pyth oracle integration
│       ├── walrus.ts             # Walrus storage integration
│       ├── wallet-mapping-storage.ts
│       ├── use-contracts.ts      # Contract interaction hooks
│       ├── use-wallet.ts         # Sui wallet hook
│       └── use-chart-data.ts     # Chart data generation
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Sui CLI** (for contract deployment)
- **MetaMask** browser extension (for ENS registration)
- **Sui Wallet** (Slush or similar) browser extension

### Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Deploy Contracts

```bash
cd contracts

# Ensure Sui CLI is configured for testnet
sui client switch --env testnet

# Build
sui move build

# Deploy
sui client publish --gas-budget 100000000
```

After deployment, update the `packageId` in `frontend/lib/contract-config.ts`.

### Environment

No environment variables required. All configuration is in:
- `frontend/lib/contract-config.ts` — contract addresses, RPC endpoints, module names
- ENS contract addresses are hardcoded in `frontend/hooks/use-ens-registration.ts`
- Pyth feed IDs are in `frontend/lib/price-feed.ts`
- Walrus endpoints are in `frontend/lib/walrus.ts`

---

## Deployment

### Contracts (Sui Testnet)

Currently deployed at:
```
Package ID: 0xea7d648351f216544ed0db53b51256490ab18e0d6965cebcfbc40abcae84a88b
Chain ID:   4c78adac (Sui Testnet)
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

Or deploy to Vercel:
```bash
npx vercel
```

---

## Tech Stack

### Smart Contracts
- **Move** — Sui's native smart contract language
- **Sui Framework** — object model, `Table`, `Balance`, `Coin`, `Clock`

### Frontend
- **Next.js 16** — App Router, React 19, TypeScript
- **Tailwind CSS 4** — styling
- **shadcn/ui** — UI component primitives (Radix UI)
- **Framer Motion** — animations
- **lightweight-charts** — TradingView candlestick charts
- **Three.js / React Three Fiber** — 3D particle background
- **Lenis** — smooth scrolling

### Blockchain & Web3
- **@mysten/sui.js** — Sui SDK for transaction construction
- **@mysten/dapp-kit** — Sui wallet connection
- **wagmi + viem** — Ethereum wallet connection (ENS registration)
- **Pyth Network** — SUI/USD oracle via Hermes API
- **Walrus** — decentralized blob storage on Sui
- **ENS** — Ethereum Name Service on Sepolia

### Data
- **@tanstack/react-query** — async state management
- **recharts** — portfolio pie charts
- **localStorage** — wallet mappings and token metadata

---

## Key Design Decisions

1. **Platform balances over Coin objects** — The protocol tracks balances in an internal `Table`, not as individual `Coin` objects. This allows the contract to control visibility, suppress events, and enforce phase rules without wrapping/unwrapping on every trade.

2. **Shared MemeToken with internal Tables** — A single shared object holds all state, enabling the contract to gate event emissions and defer metrics at the protocol level.

3. **Owned sessions as privacy vaults** — `TradingSession` objects are transferred to the user. Sui's ownership model means only the owner can read the balance — no encryption needed.

4. **Instant settlement** — The SETTLEMENT phase constant exists but is skipped in practice. `update_phase_internal()` transitions directly from PRIVATE to OPEN, merging pending stats atomically.

5. **Permissionless phase transitions** — Phase advancement is computed from `Clock` timestamps. Any user can trigger it — no admin key dependency.

6. **Cross-chain identity via ENS** — ENS on Ethereum Sepolia maps to Sui wallet addresses, creating a unified identity without requiring a custom naming system.

---

## License

Built for **HackMoney 2026**.

© 2026 MemeFi.
