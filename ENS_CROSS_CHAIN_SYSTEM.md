# ENS Cross-Chain Wallet Mapping System

## Overview

This system enables **cross-chain transactions** using ENS names by creating a mapping chain:
```
ENS Name (.eth) → Ethereum Wallet Address → Sui Wallet Address
```

When a user uses their ENS name for transactions in the MemeFi platform, the system automatically resolves it to their Sui wallet address, allowing seamless cross-chain operations.

## Architecture

### Three-Step Mapping Process

1. **ENS Registration** (Sepolia Testnet)
   - User registers a `.eth` domain on Ethereum Sepolia testnet
   - ENS name is linked to their Ethereum wallet address
   - Uses official ENS Sepolia contracts

2. **Ethereum Wallet Mapping**
   - The registered ENS name is stored with the user's ETH address
   - Creates a lookup: `ENS → ETH Address`

3. **Sui Wallet Mapping**
   - User's Ethereum address is mapped to their Sui wallet address
   - Creates a lookup: `ETH Address → Sui Address`
   - Completes the chain: `ENS → ETH → Sui`

### Key Components

#### 1. Hooks

**`use-ens-registration.ts`**
- Handles ENS domain registration on Sepolia
- Manages commit-reveal registration process
- Checks availability and pricing
- Interacts with ENS Registrar Controller contract

**`use-wallet-mapping.ts`**
- Manages the complete mapping lifecycle
- Creates and retrieves wallet mappings
- Provides resolution functions (ENS → Sui)

#### 2. Storage Service

**`wallet-mapping-storage.ts`**
- Centralized storage for all wallet mappings
- Provides utility functions for resolution
- Handles localStorage operations
- Key functions:
  - `getSuiAddressFromEns()` - Main resolution function
  - `saveWalletMapping()` - Store new mapping
  - `resolveToSuiAddress()` - Smart resolution for transactions

#### 3. UI Components

**`ens-registration-modal.tsx`**
- Multi-step registration wizard
- Progress indicator for user guidance
- Handles both ENS registration and wallet mapping
- Visual feedback for each step

## Usage

### For Users

1. **Register ENS Name**
   - Go to Portfolio page
   - Click "Get Started" on ENS Registration card
   - Follow the 3-step wizard:
     - Register your .eth name
     - Wait 60 seconds (ENS requirement)
     - Complete registration and pay fee
     - Map your Sui wallet

2. **Using ENS for Transactions**
   - Once mapped, your ENS name can be used anywhere on the platform
   - Transactions will automatically route to your Sui wallet
   - Example: `alice.eth` → resolves to Sui address `0x1234...`

### For Developers

#### Resolving ENS to Sui Address

```typescript
import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'

// Resolve ENS name to Sui address
const suiAddress = WalletMappingStorage.suiFromEns('alice.eth')

// Smart resolution (handles both ENS and direct addresses)
const resolved = WalletMappingStorage.resolve('alice.eth') // Returns Sui address
const resolved2 = WalletMappingStorage.resolve('0x123...') // Returns same address
```

#### Creating a Mapping

```typescript
import { useWalletMapping } from '@/hooks/use-wallet-mapping'

function MyComponent() {
  const { createMapping, currentMapping, isMapped } = useWalletMapping()

  const handleRegister = async () => {
    const success = await createMapping('alice.eth')
    if (success) {
      console.log('Mapping created!', currentMapping)
    }
  }

  return (
    <div>
      {isMapped ? (
        <p>Mapped: {currentMapping?.ensName} → {currentMapping?.suiAddress}</p>
      ) : (
        <button onClick={handleRegister}>Create Mapping</button>
      )}
    </div>
  )
}
```

#### Using in Token Transactions

```typescript
import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'

async function buyTokens(recipientAddress: string, amount: number) {
  // Resolve address (works with both ENS names and direct addresses)
  const suiAddress = WalletMappingStorage.resolve(recipientAddress)
  
  // Now use suiAddress for Sui blockchain transaction
  await suiClient.buyTokens(suiAddress, amount)
}

// Usage
buyTokens('alice.eth', 100) // Resolves to Sui address
buyTokens('0x1234...', 100) // Uses address directly
```

## Storage Structure

All mappings are stored in localStorage:

```typescript
// Complete mapping by ETH address
localStorage['wallet-mapping-0x1234...'] = {
  ensName: 'alice.eth',
  ethAddress: '0x1234...',
  suiAddress: '0xabcd...',
  timestamp: 1234567890
}

// ENS to ETH lookup
localStorage['ens-to-eth-alice.eth'] = '0x1234...'

// ETH to Sui lookup
localStorage['eth-to-sui-0x1234...'] = '0xabcd...'

// User's primary ENS
localStorage['userEnsAddress'] = 'alice.eth'
```

## Contract Addresses (Sepolia Testnet)

```typescript
ETH_REGISTRAR_CONTROLLER = "0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968"
PUBLIC_RESOLVER = "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5"
```

## Benefits

1. **User Experience**
   - Use memorable ENS names instead of long addresses
   - Single identity across multiple chains
   - Simplified transaction flow

2. **Cross-Chain Compatibility**
   - Register on Ethereum, transact on Sui
   - Leverage ENS infrastructure
   - Future-proof for additional chains

3. **Developer Experience**
   - Simple resolution API
   - Automatic handling of ENS vs direct addresses
   - Centralized mapping management

## Security Considerations

1. **Local Storage**
   - Mappings are stored client-side
   - No private keys are stored
   - Mappings are public information (addresses)

2. **Verification**
   - ENS registration happens on-chain (Sepolia)
   - Wallet signatures required for all operations
   - No server-side dependencies

3. **Future Enhancements**
   - Add smart contract registry for mappings
   - Implement signature verification for mapping creation
   - Add IPFS/decentralized storage backup

## Testing

### Test ENS Registration

1. Connect MetaMask to Sepolia testnet
2. Get Sepolia ETH from faucet
3. Register a test ENS name
4. Map to Sui wallet

### Test Resolution

```typescript
// In browser console
const mapping = localStorage.getItem('wallet-mapping-YOUR_ETH_ADDRESS')
console.log(JSON.parse(mapping))
```

## Troubleshooting

### ENS Registration Fails
- Ensure you're on Sepolia testnet
- Check you have enough Sepolia ETH
- Wait full 60 seconds after commitment
- Check name is available and valid (3+ chars)

### Mapping Not Found
- Verify both ETH and Sui wallets are connected
- Check localStorage for mapping entries
- Ensure registration completed successfully

### Resolution Returns Null
- Verify ENS name is correct (include .eth)
- Check mapping was created successfully
- Try using direct Sui address as fallback

## Future Roadmap

- [ ] Add on-chain mapping registry contract
- [ ] Support multiple chains beyond Sui
- [ ] Implement reverse resolution (Sui → ENS)
- [ ] Add ENS subdomain support
- [ ] Create admin panel for mapping management
- [ ] Add mapping expiration and renewal
- [ ] Implement batch resolution for efficiency

## API Reference

See inline documentation in:
- `/hooks/use-ens-registration.ts`
- `/hooks/use-wallet-mapping.ts`
- `/lib/wallet-mapping-storage.ts`

## Support

For issues or questions:
1. Check browser console for detailed logs
2. Verify wallet connections
3. Review localStorage entries
4. Check Sepolia testnet status

---

**Note**: This system currently operates on testnets (Sepolia for ETH, testnet for Sui). For production, deploy to mainnets and update contract addresses accordingly.
