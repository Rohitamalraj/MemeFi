# 🚀 Quick Start: ENS Cross-Chain System

## What You Just Got

A complete ENS-to-Sui wallet mapping system in your portfolio page! Users can now register ENS names and use them for Sui blockchain transactions.

## ⚡ Installation (2 minutes)

### Step 1: Install Dependencies

```bash
cd frontend
npm install wagmi viem
```

Or if using yarn/pnpm:
```bash
yarn add wagmi viem
# or
pnpm add wagmi viem
```

### Step 2: Wrap Your App

Update `frontend/app/layout.tsx`:

```typescript
import { Web3Provider } from '@/components/web3-provider'
import { Providers } from '@/components/providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>  {/* Add this wrapper */}
          <Providers>
            {children}
          </Providers>
        </Web3Provider>
      </body>
    </html>
  )
}
```

### Step 3: Add MetaMask Button to Navigation

Update `frontend/components/navigation.tsx`:

```typescript
'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'

export function Navigation() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <nav>
      {/* Your existing nav items */}
      
      {/* Add ETH Wallet Connection */}
      <div className="flex items-center gap-4">
        {isConnected ? (
          <Button onClick={() => disconnect()} variant="outline">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Button>
        ) : (
          <Button onClick={() => connect({ connector: connectors[0] })}>
            Connect MetaMask
          </Button>
        )}
        
        {/* Your existing Sui wallet button */}
      </div>
    </nav>
  )
}
```

## ✅ That's It!

You're done! The portfolio page now has ENS registration functionality.

## 🧪 Test It Out

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Connect MetaMask**:
   - Install MetaMask extension if needed
   - Switch to Sepolia testnet
   - Connect to your app

3. **Get test ETH**:
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Get 0.01+ ETH

4. **Register ENS**:
   - Go to Portfolio page
   - Click "Get Started" in ENS card
   - Follow the 3-step wizard:
     - Check availability
     - Start registration (commits)
     - Wait 60 seconds
     - Complete registration (pay fee)
     - Map Sui wallet

5. **Verify it works**:
   ```javascript
   // In browser console (F12)
   const sui = WalletMappingStorage.suiFromEns('yourname.eth')
   console.log('Your ENS resolves to:', sui)
   ```

## 📁 What Was Created

```
frontend/
├── hooks/
│   ├── use-ens-registration.ts       ENS registration logic
│   └── use-wallet-mapping.ts         Wallet mapping management
├── lib/
│   └── wallet-mapping-storage.ts     Core resolution logic
├── components/
│   ├── ens-registration-modal.tsx    3-step registration wizard
│   ├── web3-provider.tsx             Wagmi configuration
│   ├── portfolio-page.tsx            ✏️ Updated with ENS button
│   ├── ui/
│   │   └── input.tsx                 New input component
│   └── examples/
│       └── ens-token-transaction-example.tsx
```

## 💡 How to Use in Your Code

### Resolve ENS to Sui Address

```typescript
import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'

// Works with both ENS names and direct addresses
const suiAddress = WalletMappingStorage.resolve('alice.eth')
// or
const suiAddress = WalletMappingStorage.resolve('0x123...')
```

### Check if User Has ENS Mapped

```typescript
import { useWalletMapping } from '@/hooks/use-wallet-mapping'

function MyComponent() {
  const { isMapped, currentMapping } = useWalletMapping()

  return (
    <div>
      {isMapped ? (
        <p>Your ENS: {currentMapping?.ensName}</p>
      ) : (
        <button>Register ENS</button>
      )}
    </div>
  )
}
```

### Use in Token Transactions

```typescript
async function buyTokens(recipient: string, amount: number) {
  // Automatically handles ENS → Sui resolution
  const suiRecipient = WalletMappingStorage.resolve(recipient)
  
  // Your Sui transaction logic
  await suiClient.buyTokens(suiRecipient, amount)
}

// Usage
buyTokens('alice.eth', 100)  // ✅ Resolves ENS
buyTokens('0x123...', 100)   // ✅ Uses directly
```

## 🎯 The Flow

```
┌─────────────────────────────────────────┐
│  User visits Portfolio Page              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Sees ENS Registration Card              │
│  • Not mapped: "Get Started" button     │
│  • Mapped: Shows ENS details            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Clicks "Get Started" → Modal Opens     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Step 1: Enter ENS name & check         │
│  Step 2: Register on Ethereum           │
│  Step 3: Map to Sui wallet              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Success! ENS → ETH → Sui mapped        │
│  Now can use ENS for transactions       │
└─────────────────────────────────────────┘
```

## 🎨 What Users See

### Before Registration
![ENS Card - Not Registered]
- Yellow card with "Register ENS Name"  
- "Get Started" button
- Shows 3-step process badges

### After Registration
![ENS Card - Registered]
- Green card with checkmark
- Shows ENS name, ETH address, Sui address
- "View Setup" button

### Registration Modal
![3-Step Wizard]
- Progress indicator (1/2/3)
- Step 1: ENS domain input & availability
- Step 2: Wallet mapping with connection status
- Step 3: Success with explorer links

## 🐛 Troubleshooting

### "Cannot find module 'wagmi'"
→ Run `npm install wagmi viem`

### MetaMask not connecting
→ Ensure MetaMask is installed and unlocked
→ Switch to Sepolia testnet in MetaMask

### ENS registration fails
→ Get Sepolia ETH from faucet
→ Make sure you're on Sepolia network
→ Wait full 60 seconds after commitment

### Sui wallet not detected
→ Make sure both wallets are connected
→ Refresh page after connecting

## 📚 Documentation

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete overview
- **[ENS_SETUP_GUIDE.md](./ENS_SETUP_GUIDE.md)** - Detailed setup guide
- **[ENS_CROSS_CHAIN_SYSTEM.md](./ENS_CROSS_CHAIN_SYSTEM.md)** - Architecture docs

## 🎉 You're Ready!

Your users can now:
- ✅ Register memorable ENS names
- ✅ Map them to Sui wallets
- ✅ Use ENS for cross-chain transactions
- ✅ See their mapping status in portfolio

**Next**: Integrate ENS resolution into your token buying/selling flows!

---

Need help? Check the docs or browser console for detailed logs.
