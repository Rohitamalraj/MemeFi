# Frontend-Backend Integration Guide

## 📋 Prerequisites

### 1. Complete Smart Contract Deployment

```bash
# In memefi-contracts directory
cd d:\Projects\HackMoney\memefi-contracts

# Wait for Sui CLI installation to complete
sui --version

# Build contracts
sui move build

# Run tests
sui move test

# Deploy to devnet
sui client publish --gas-budget 100000000
```

**Save these values from deployment:**
- Package ID
- Module names (token, session)

### 2. Install Frontend Dependencies

Due to npm permission issues, run as Administrator:

```powershell
# Open PowerShell as Administrator
cd d:\Projects\HackMoney\memefi-frontend

# Install Sui packages
npm install @mysten/sui.js@latest
npm install @mysten/dapp-kit@latest
npm install @tanstack/react-query@latest
```

## 🔧 Configuration

### Step 1: Update Contract Config

Edit `lib/contract-config.ts`:

```typescript
export const MEMEFI_CONFIG = {
  network: 'devnet',
  packageId: '0xYOUR_PACKAGE_ID_HERE', // ← Update this
  // ...rest stays the same
};
```

### Step 2: Wrap App with Sui Provider

Edit `app/layout.tsx`:

```typescript
import { SuiProvider } from '@/components/sui-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SuiProvider>
          <ThemeProvider>
            <LenisProvider>
              {children}
            </LenisProvider>
          </ThemeProvider>
        </SuiProvider>
      </body>
    </html>
  );
}
```

### Step 3: Update Navigation

Edit `components/navigation.tsx`:

Replace the "Connect Wallet" button with:

```typescript
import { WalletConnectButton } from './wallet-connect';

// Replace the button with:
<WalletConnectButton />
```

## 🚀 Integration Examples

### Launch Form Integration

Edit `app/launch/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { createTokenTransaction } from '@/lib/sui-client';

export default function LaunchPage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  
  const handleSubmit = async (formData: any) => {
    try {
      // Create transaction
      const txb = createTokenTransaction({
        name: formData.name,
        symbol: formData.symbol,
        totalSupply: parseInt(formData.supply),
        maxBuyPerWallet: parseInt(formData.maxBuy),
        phaseDurationMs: parseInt(formData.phaseDuration) * 3600000, // hours to ms
        transfersLocked: formData.transferRestrictions === 'locked',
      });

      // Sign and execute
      signAndExecute(
        {
          transactionBlock: txb,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: (result) => {
            console.log('Token launched!', result);
            // Show success message
            // Extract LaunchRules object ID from result
          },
          onError: (error) => {
            console.error('Launch failed:', error);
            // Show error message
          },
        }
      );
    } catch (error) {
      console.error('Transaction creation failed:', error);
    }
  };

  // ... rest of component
}
```

### Session Creation Integration

```typescript
import { createSessionTransaction } from '@/lib/sui-client';
import { useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';

const handleCreateSession = async (sessionData: any) => {
  const txb = createSessionTransaction({
    name: sessionData.name,
    tokenName: sessionData.tokenName,
    durationMs: sessionData.duration * 3600000,
    tokenType: `${MEMEFI_CONFIG.packageId}::token::MEMETOKEN`,
  });

  signAndExecute(
    { transactionBlock: txb },
    {
      onSuccess: (result) => {
        console.log('Session created!', result);
      },
    }
  );
};
```

### Join Session Integration

```typescript
import { joinSessionTransaction } from '@/lib/sui-client';

const handleJoinSession = async (sessionId: string) => {
  // Generate random ENS-style name
  const anonNumber = Math.floor(Math.random() * 10000);
  const ensName = `anon${anonNumber}.session.memefi.eth`;

  const txb = joinSessionTransaction({
    sessionObjectId: sessionId,
    ensName,
    tokenType: `${MEMEFI_CONFIG.packageId}::token::MEMETOKEN`,
  });

  signAndExecute(
    { transactionBlock: txb },
    {
      onSuccess: () => {
        console.log('Joined session with identity:', ensName);
      },
    }
  );
};
```

## 📊 Querying Data

### Get Token Info

```typescript
import { getSuiClient } from '@/lib/sui-client';

async function getTokenRules(rulesObjectId: string) {
  const client = getSuiClient();
  
  const object = await client.getObject({
    id: rulesObjectId,
    options: {
      showContent: true,
      showType: true,
    },
  });

  // Parse content to get token info
  return object.data;
}
```

### Get Active Sessions

```typescript
async function getActiveSessions() {
  const client = getSuiClient();
  
  // Query all TradingSession objects
  const objects = await client.queryObjects({
    filter: {
      MatchAll: [
        {
          StructType: `${MEMEFI_CONFIG.packageId}::session::TradingSession`,
        },
      ],
    },
    options: {
      showContent: true,
    },
  });

  return objects.data;
}
```

## 🎨 UI Updates

### Show Wallet Address

```typescript
import { useCurrentAccount } from '@mysten/dapp-kit';

export function UserProfile() {
  const account = useCurrentAccount();
  
  if (!account) return <div>Not connected</div>;
  
  return (
    <div>
      <p>Address: {account.address}</p>
    </div>
  );
}
```

### Transaction Status

```typescript
import { useTransactionStatus } from '@mysten/dapp-kit';

export function TransactionTracker({ digest }: { digest: string }) {
  const { data: status, isLoading } = useTransactionStatus({
    digest,
  });
  
  if (isLoading) return <div>Processing...</div>;
  
  return (
    <div>
      Status: {status?.effects?.status?.status}
    </div>
  );
}
```

## 🐛 Debugging

### Check Package Deployment

```bash
sui client object <PACKAGE_ID>
```

### Test Transaction Simulation

```typescript
import { Transaction } from '@mysten/sui.js/transactions';

const tx = new Transaction();
// ... build transaction

// Simulate without executing
const result = await client.devInspectTransactionBlock({
  sender: account.address,
  transactionBlock: tx,
});

console.log('Simulation result:', result);
```

## 📝 Next Steps

1. ✅ Deploy contracts to devnet
2. ✅ Get package ID
3. ✅ Update frontend config
4. ✅ Install Sui packages
5. ✅ Add wallet connection
6. ✅ Integrate launch form
7. ✅ Integrate session functions
8. ✅ Test end-to-end flow
9. 🔲 Deploy frontend to Vercel
10. 🔲 Demo video for hackathon

## 🔗 Resources

- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)
- [Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
- [Move by Example](https://examples.sui.io/)
- [Sui Explorer](https://suiscan.xyz/devnet)

## ⚠️ Known Issues

1. **npm permissions**: Run PowerShell as Administrator
2. **Wallet not connecting**: Clear browser cache and reconnect
3. **Transaction fails**: Check gas balance on devnet
4. **Object not found**: Ensure you're using correct network (devnet/testnet)

## 🎯 Testing Checklist

- [ ] Wallet connects successfully
- [ ] Launch form creates token
- [ ] Token rules are enforced
- [ ] Session can be created
- [ ] Can join session with ENS identity
- [ ] Can trade within session
- [ ] Session settles correctly
- [ ] Explorer shows all tokens
- [ ] Dashboard shows user data
