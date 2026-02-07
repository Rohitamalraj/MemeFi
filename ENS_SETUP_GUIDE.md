# ENS Cross-Chain Setup Guide

## Prerequisites

This guide will help you set up the ENS cross-chain wallet mapping system in your MemeFi project.

## Step 1: Install Dependencies

Install the required packages for Ethereum wallet integration:

```bash
npm install wagmi viem @tanstack/react-query
# or
yarn add wagmi viem @tanstack/react-query
# or
pnpm add wagmi viem @tanstack/react-query
```

### Package Versions (Recommended)

```json
{
  "wagmi": "^2.15.0",
  "viem": "^2.21.0",
  "@tanstack/react-query": "^5.90.20"
}
```

**Note**: `@tanstack/react-query` is already installed in your project.

## Step 2: Configure Wagmi Provider

Create a new file `app/providers.tsx` or update your existing providers file:

```typescript
'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'

// Configure chains & providers
const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

## Step 3: Update Root Layout

Update `app/layout.tsx` to include the Web3Provider:

```typescript
import { Web3Provider } from './providers'
import { Providers } from '@/components/providers' // Your existing Sui provider

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <Providers>
            {children}
          </Providers>
        </Web3Provider>
      </body>
    </html>
  )
}
```

## Step 4: Update Navigation Component

Add MetaMask connection button to your navigation:

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
      {/* Existing navigation items */}
      
      {/* Ethereum Wallet Connection */}
      {isConnected ? (
        <Button onClick={() => disconnect()}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </Button>
      ) : (
        <Button onClick={() => connect({ connector: connectors[0] })}>
          Connect MetaMask
        </Button>
      )}
      
      {/* Existing Sui wallet button */}
    </nav>
  )
}
```

## Step 5: Test the Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Connect MetaMask**:
   - Make sure MetaMask is installed
   - Switch to Sepolia testnet
   - Connect your wallet

3. **Get Sepolia ETH**:
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Or [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - Get test ETH for registration fees

4. **Connect Sui Wallet**:
   - Install Sui Wallet browser extension
   - Connect to your application

5. **Test ENS Registration**:
   - Go to Portfolio page
   - Click "Get Started" on ENS Registration card
   - Follow the registration wizard
   - Register a test name (e.g., `yourname.eth`)

## Step 6: Verify the Integration

### Check Browser Console

You should see logs like:
```
✅ ENS registered and saved to localStorage: yourname.eth
✅ Wallet mapping saved: { ens: 'yourname.eth', eth: '0x...', sui: '0x...' }
```

### Check localStorage

Open DevTools → Application → Local Storage:
```javascript
localStorage.getItem('userEnsAddress')
localStorage.getItem('wallet-mapping-YOUR_ETH_ADDRESS')
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Portfolio Page + ENS Registration Modal        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  React Hooks Layer                      │
│  ┌──────────────────┐      ┌────────────────────────┐  │
│  │use-ens-          │      │use-wallet-mapping      │  │
│  │registration      │ ───▶ │                        │  │
│  └──────────────────┘      └────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Storage & Resolution Layer                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  wallet-mapping-storage.ts                      │   │
│  │  • ENS → ETH → Sui Resolution                   │   │
│  │  • localStorage Management                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────┐          ┌──────────────────────┐
│  Ethereum        │          │  Sui Blockchain      │
│  Sepolia Testnet │          │  Testnet             │
│  (ENS Registry)  │          │  (Transactions)      │
└──────────────────┘          └──────────────────────┘
```

## Usage in Your Application

### Resolve ENS in Token Transactions

Update your token buying/selling logic:

```typescript
import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'

async function handleTokenPurchase(recipientInput: string, amount: number) {
  try {
    // Automatically resolves ENS to Sui address
    const suiRecipient = WalletMappingStorage.resolve(recipientInput)
    
    // Now use suiRecipient for Sui transaction
    await buyTokensOnSui(suiRecipient, amount)
    
    console.log('✅ Transaction sent to:', suiRecipient)
  } catch (error) {
    console.error('❌ Failed to resolve address:', error)
  }
}

// Usage examples:
handleTokenPurchase('alice.eth', 100)  // Resolves to Sui address
handleTokenPurchase('0x1234...', 100)  // Uses directly
```

### Display ENS Names

```typescript
import { useWalletMapping } from '@/hooks/use-wallet-mapping'

function UserProfile() {
  const { currentMapping, isMapped } = useWalletMapping()

  return (
    <div>
      {isMapped && currentMapping ? (
        <div>
          <p>ENS: {currentMapping.ensName}</p>
          <p>ETH: {currentMapping.ethAddress}</p>
          <p>Sui: {currentMapping.suiAddress}</p>
        </div>
      ) : (
        <button>Register ENS Name</button>
      )}
    </div>
  )
}
```

## Troubleshooting

### MetaMask Not Connecting

1. Check MetaMask is installed and unlocked
2. Verify you're on Sepolia testnet
3. Clear site permissions and reconnect
4. Check browser console for errors

### ENS Registration Fails

1. **"Not enough ETH"**: Get Sepolia ETH from faucet
2. **"Name not available"**: Try a different name
3. **"Wait 60s"**: ENS requires waiting period after commitment
4. **"Transaction failed"**: Check gas settings in MetaMask

### Wallet Mapping Not Working

1. Ensure both ETH and Sui wallets are connected
2. Check localStorage for mapping entries
3. Verify ENS registration completed successfully
4. Try disconnecting and reconnecting both wallets

### Common Errors

```typescript
// Error: ENS name not mapped
// Solution: Complete the full registration process including wallet mapping

// Error: No Sui address found
// Solution: Ensure Sui wallet is connected during mapping step

// Error: Invalid ENS name
// Solution: ENS names must be 3+ characters, lowercase, alphanumeric
```

## Testing Checklist

- [ ] MetaMask installed and connected to Sepolia
- [ ] Sepolia ETH in wallet (use faucet)
- [ ] Sui Wallet installed and connected
- [ ] Can check ENS name availability
- [ ] Can complete ENS registration (commit + register)
- [ ] Can map Sui wallet to ETH address
- [ ] Can see mapping in Portfolio page
- [ ] ENS resolution works in console
- [ ] Transaction routing works correctly

## Next Steps

1. **Integrate with Token Trading**:
   - Update buy/sell flows to accept ENS names
   - Add ENS input field with dropdown suggestions
   - Show ENS names in transaction history

2. **Add Profile Features**:
   - Display ENS name as user identity
   - Show ENS avatar (if set)
   - Add ENS records (Twitter, Discord, etc.)

3. **Enhance UX**:
   - Add ENS name validation UI
   - Show real-time availability
   - Display estimated gas costs
   - Add transaction status notifications

4. **Security Improvements**:
   - Add mapping verification
   - Implement signature checks
   - Rate limit resolvers
   - Add mapping expiration

## Resources

- [ENS Documentation](https://docs.ens.domains/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Sepolia Testnet](https://sepolia.dev/)
- [Sui Documentation](https://docs.sui.io/)

## Support

For issues:
1. Check browser console logs
2. Verify wallet connections
3. Review ENS_CROSS_CHAIN_SYSTEM.md
4. Check localStorage mappings

---

**Ready to test!** Open your browser, connect both wallets, and register your first ENS name!
