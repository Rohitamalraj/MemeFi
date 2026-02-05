# MemeFi Backend & Frontend Integration Guide

## 🚀 Quick Start

### Step 1: Install Sui CLI

#### Prerequisites
- Rust and Cargo (already installed ✅)
- C++ Build Tools (required)

#### Install C++ Build Tools (Windows)
```powershell
# Download and install Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++" workload
```

#### Install Sui CLI
```powershell
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

Verify installation:
```powershell
sui --version
```

---

### Step 2: Setup Sui Wallet

```powershell
# Initialize Sui client
sui client

# Create new wallet or import existing
sui client new-address ed25519

# Get test SUI from faucet
sui client faucet

# Check balance
sui client gas
```

---

### Step 3: Build & Test Contracts

```powershell
cd d:\Projects\HackMoney\memefi-contracts

# Build contracts
sui move build

# Run tests
sui move test

# If tests pass, proceed to deployment
```

---

### Step 4: Deploy to Devnet

```powershell
# Deploy contracts
sui client publish --gas-budget 100000000

# IMPORTANT: Save the Package ID from output!
# Example output:
# ╭────────────────────────────────────────────────╮
# │ Package ID: 0xABC123...                        │
# ╰────────────────────────────────────────────────╯
```

---

### Step 5: Update Frontend Configuration

Edit `frontend/lib/contract-config.ts`:

```typescript
export const MEMEFI_CONFIG = {
  network: 'devnet',
  packageId: '0xYOUR_PACKAGE_ID_HERE', // ⬅️ UPDATE THIS
  // ... rest of config
};
```

---

### Step 6: Install Frontend Dependencies

```powershell
cd d:\Projects\HackMoney\frontend

# Install Sui packages
npm install @mysten/sui.js@latest
npm install @mysten/dapp-kit@latest
npm install @tanstack/react-query@latest
```

---

### Step 7: Wrap App with SuiProvider

Update `frontend/app/layout.tsx`:

```typescript
import { SuiProvider } from '@/components/sui-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SuiProvider>
          {children}
        </SuiProvider>
      </body>
    </html>
  );
}
```

---

### Step 8: Update Launch Form

Replace mock submission in `frontend/components/launch-form.tsx` with:

```typescript
import { useTokenLaunch } from '@/lib/use-contracts';
import { useWalletConnection } from '@/lib/use-wallet';

export function LaunchForm() {
  const { launchToken, isLaunching, launchResult } = useTokenLaunch();
  const { isConnected } = useWalletConnection();
  
  const handleSubmit = async (values) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    
    const result = await launchToken({
      name: values.name,
      symbol: values.symbol,
      totalSupply: parseInt(values.totalSupply),
      maxBuyPerWallet: parseInt(values.maxBuy),
      phaseDurationMs: parseInt(values.phaseDuration) * 3600000, // hours to ms
      transfersLocked: values.transfersLocked,
    });
    
    if (result.success) {
      console.log('Transaction:', launchResult?.explorerUrl);
      // Show success state
    }
  };
  
  // ... rest of form
}
```

---

### Step 9: Update Navigation

Add wallet button to `frontend/components/navigation.tsx`:

```typescript
import { WalletButton } from './wallet-button';

// In the navigation JSX:
<WalletButton />
```

---

### Step 10: Test Integration

```powershell
cd d:\Projects\HackMoney\frontend
npm run dev
```

1. Open http://localhost:3000
2. Connect Sui wallet
3. Navigate to Launch page
4. Fill form and submit
5. Approve transaction in wallet
6. Check transaction on Sui Explorer

---

## 📁 Files Created

### Smart Contracts
- ✅ `memefi-contracts/sources/token.move` - Token launch module
- ✅ `memefi-contracts/sources/session.move` - Trading session module
- ✅ `memefi-contracts/tests/token_tests.move` - Token tests
- ✅ `memefi-contracts/tests/session_tests.move` - Session tests
- ✅ `memefi-contracts/Move.toml` - Project configuration
- ✅ `memefi-contracts/README.md` - Contract documentation

### Frontend Integration
- ✅ `frontend/lib/contract-config.ts` - Contract configuration
- ✅ `frontend/lib/sui-client.ts` - Transaction builders
- ✅ `frontend/lib/use-wallet.ts` - Wallet connection hook
- ✅ `frontend/lib/use-contracts.ts` - Contract interaction hooks
- ✅ `frontend/components/sui-provider.tsx` - Sui wallet provider
- ✅ `frontend/components/wallet-button.tsx` - Connect wallet button

### Documentation
- ✅ `BACKEND_ROADMAP.md` - Development checklist
- ✅ `SETUP_GUIDE.md` - This file

---

## 🐛 Troubleshooting

### Sui CLI Installation Fails
```
Error: linker `link.exe` not found
```
**Solution**: Install Visual Studio Build Tools with C++ workload

### NPM Permission Error
```
Error: EPERM: operation not permitted
```
**Solution**: Run PowerShell as Administrator or check antivirus

### Transaction Fails
- Check wallet has sufficient SUI for gas
- Verify package ID is correct in config
- Check network matches (devnet/testnet/mainnet)

### Wallet Won't Connect
- Install Sui Wallet extension
- Switch to correct network in wallet
- Refresh page and try again

---

## 🎯 Next Steps

1. ✅ Install Sui CLI with C++ tools
2. ✅ Deploy contracts to devnet
3. ✅ Update frontend config with package ID
4. ✅ Install npm packages
5. ✅ Test token launch flow
6. ⏳ Test session creation
7. ⏳ Test trading in session
8. ⏳ Add ENS subdomain service
9. ⏳ Deploy frontend to Vercel
10. ⏳ Submit to HackMoney!

---

## 📞 Support

- Sui Documentation: https://docs.sui.io
- Sui Discord: https://discord.gg/sui
- Move Language: https://move-language.github.io/move/

---

**Status**: Smart contracts ready ✅ | Frontend integration ready ✅ | Deployment pending ⏳
