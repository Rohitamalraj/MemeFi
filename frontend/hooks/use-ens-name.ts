'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWalletConnection } from '@/lib/use-wallet'
import { WalletMappingStorage } from '@/lib/wallet-mapping-storage'

/**
 * Hook to get ENS name for currently connected wallets
 * Returns ENS name ONLY if the currently connected wallet matches the mapping
 * This prevents showing ENS for the wrong wallet
 */
export function useEnsName() {
  const { address: ethAddress } = useAccount() // Ethereum address
  const { address: suiAddress } = useWalletConnection() // Sui address
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEnsName = () => {
      setIsLoading(true)
      
      try {
        // CRITICAL: Only show ENS if currently connected wallet matches the mapping
        
        // Try to get mapping by ETH address
        if (ethAddress) {
          const mapping = WalletMappingStorage.get(ethAddress)
          if (mapping && mapping.ensName) {
            // VERIFY: Check if the mapped Sui address matches the currently connected one
            if (suiAddress && mapping.suiAddress.toLowerCase() === suiAddress.toLowerCase()) {
              setEnsName(mapping.ensName)
              console.log('✅ ENS name verified for connected wallets:', mapping.ensName)
              setIsLoading(false)
              return
            } else {
              // ETH wallet matches but Sui wallet is different - don't show ENS
              console.log('⚠️ ETH wallet matches mapping but Sui wallet is different')
              setEnsName(null)
              setIsLoading(false)
              return
            }
          }
        }

        // Try to find by Sui address (reverse lookup)
        if (suiAddress) {
          const allMappings = WalletMappingStorage.getAll()
          const found = allMappings.find(m => m.suiAddress.toLowerCase() === suiAddress.toLowerCase())
          if (found && found.ensName) {
            // VERIFY: Check if the mapped ETH address matches the currently connected one (if any)
            if (!ethAddress || found.ethAddress.toLowerCase() === ethAddress.toLowerCase()) {
              setEnsName(found.ensName)
              console.log('✅ ENS name verified via Sui address:', found.ensName)
              setIsLoading(false)
              return
            } else {
              // Sui wallet matches but ETH wallet is different - don't show ENS
              console.log('⚠️ Sui wallet matches mapping but ETH wallet is different')
              setEnsName(null)
              setIsLoading(false)
              return
            }
          }
        }

        // No matching mapping found for current wallets
        console.log('ℹ️ No ENS mapping found for currently connected wallets')
        setEnsName(null)
      } catch (error) {
        console.error('Error loading ENS name:', error)
        setEnsName(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadEnsName()

    // Listen for ENS registration events
    const handleEnsRegistered = () => {
      loadEnsName()
    }

    window.addEventListener('ensRegistered', handleEnsRegistered)
    
    return () => {
      window.removeEventListener('ensRegistered', handleEnsRegistered)
    }
  }, [ethAddress, suiAddress])

  return { ensName, isLoading }
}

/**
 * Hook to format display name - shows ENS if available, otherwise address
 */
export function useDisplayName(address?: string) {
  const { ensName } = useEnsName()

  if (!address) return null
  
  if (ensName) {
    return ensName
  }

  // Fallback to shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
