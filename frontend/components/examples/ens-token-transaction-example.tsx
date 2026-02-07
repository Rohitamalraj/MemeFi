'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

/**
 * Example component showing how to use ENS resolution in token transactions
 * This demonstrates the cross-chain functionality where ENS names resolve to Sui addresses
 */
export function ENSTokenTransactionExample() {
  const [recipientInput, setRecipientInput] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const handleResolve = () => {
    setIsResolving(true)
    setError(null)
    setResolvedAddress(null)

    try {
      // This is the key function that resolves ENS → Sui
      const suiAddress = WalletMappingStorage.resolve(recipientInput)
      setResolvedAddress(suiAddress)
      
      console.log('✅ Resolved:', {
        input: recipientInput,
        output: suiAddress,
        isEns: recipientInput.endsWith('.eth')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolution failed')
    } finally {
      setIsResolving(false)
    }
  }

  const handleBuyTokens = async () => {
    if (!resolvedAddress) return

    try {
      // Example: Buy tokens using the resolved Sui address
      console.log('🚀 Buying tokens for:', resolvedAddress)
      
      // Your actual token buying logic here
      // await buyTokensOnSui(resolvedAddress, amount)
      
      alert(`Transaction sent to: ${resolvedAddress}`)
    } catch (err) {
      console.error('Transaction failed:', err)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Send Tokens with ENS</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter an ENS name (e.g., alice.eth) or a Sui address
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Recipient</label>
        <div className="flex gap-2">
          <Input
            placeholder="alice.eth or 0x..."
            value={recipientInput}
            onChange={(e) => {
              setRecipientInput(e.target.value)
              setResolvedAddress(null)
              setError(null)
            }}
          />
          <Button 
            onClick={handleResolve}
            disabled={!recipientInput || isResolving}
          >
            {isResolving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Check'
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-destructive font-medium">{error}</p>
            <p className="text-xs text-destructive/70 mt-1">
              Make sure the ENS name is registered and mapped to a Sui wallet
            </p>
          </div>
        </div>
      )}

      {/* Success - Resolved Address */}
      {resolvedAddress && (
        <div className="space-y-3">
          <div className="flex gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 mb-1">Address Resolved!</p>
              
              {recipientInput.endsWith('.eth') && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground">ENS Name:</p>
                  <p className="text-sm font-mono">{recipientInput}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-muted-foreground">Sui Address:</p>
                <p className="text-xs font-mono break-all">{resolvedAddress}</p>
              </div>
            </div>
          </div>

          {/* Transaction Button */}
          <Button 
            onClick={handleBuyTokens}
            className="w-full bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90"
          >
            Send Tokens to {recipientInput.endsWith('.eth') ? recipientInput : 'Address'}
          </Button>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Cross-Chain Magic:</strong> This transaction will be processed on the{' '}
              <strong>Sui blockchain</strong> using the resolved Sui address, even though the
              ENS name is registered on Ethereum!
            </p>
          </div>
        </div>
      )}

      {/* Example Code */}
      <details className="text-xs">
        <summary className="cursor-pointer font-medium mb-2">View Implementation Code</summary>
        <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'

// Resolve ENS or direct address
const suiAddress = WalletMappingStorage.resolve(input)

// Use in your transaction
await buyTokens(suiAddress, amount)
`}
        </pre>
      </details>
    </div>
  )
}
