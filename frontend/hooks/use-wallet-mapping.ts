'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWalletConnection } from '@/lib/use-wallet'

interface WalletMapping {
  ensName: string
  ethAddress: string
  suiAddress: string
  timestamp: number
}

/**
 * Hook to manage ENS → ETH → Sui wallet mappings
 * This enables cross-chain transactions using ENS names
 */
export function useWalletMapping() {
  const { address: ethAddress } = useAccount() // Ethereum address from wagmi
  const { address: suiAddress } = useWalletConnection() // Sui address
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMapping, setCurrentMapping] = useState<WalletMapping | null>(null)

  // Load existing mapping on mount
  useEffect(() => {
    loadMapping()
  }, [ethAddress, suiAddress])

  /**
   * Load existing wallet mapping from localStorage
   */
  const loadMapping = useCallback(() => {
    try {
      if (!ethAddress) return

      const stored = localStorage.getItem(`wallet-mapping-${ethAddress.toLowerCase()}`)
      if (stored) {
        const mapping = JSON.parse(stored) as WalletMapping
        setCurrentMapping(mapping)
        console.log('✅ Loaded wallet mapping:', mapping)
      }
    } catch (err) {
      console.error('Error loading wallet mapping:', err)
    }
  }, [ethAddress])

  /**
   * Create a new wallet mapping: ENS → ETH → Sui
   */
  const createMapping = useCallback(async (ensName: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!ethAddress) {
        setError('Ethereum wallet not connected')
        setIsLoading(false)
        return false
      }

      if (!suiAddress) {
        setError('Sui wallet not connected')
        setIsLoading(false)
        return false
      }

      const mapping: WalletMapping = {
        ensName: ensName.toLowerCase(),
        ethAddress: ethAddress.toLowerCase(),
        suiAddress: suiAddress,
        timestamp: Date.now(),
      }

      // Store mapping by ETH address
      localStorage.setItem(
        `wallet-mapping-${ethAddress.toLowerCase()}`,
        JSON.stringify(mapping)
      )

      // Also store reverse lookup: ENS → ETH address
      localStorage.setItem(
        `ens-to-eth-${ensName.toLowerCase()}`,
        ethAddress.toLowerCase()
      )

      // Store ETH → Sui mapping
      localStorage.setItem(
        `eth-to-sui-${ethAddress.toLowerCase()}`,
        suiAddress
      )

      setCurrentMapping(mapping)
      console.log('✅ Created wallet mapping:', mapping)

      setIsLoading(false)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create mapping'
      setError(msg)
      setIsLoading(false)
      return false
    }
  }, [ethAddress, suiAddress])

  /**
   * Get Sui address from ENS name
   */
  const getSuiAddressFromEns = useCallback((ensName: string): string | null => {
    try {
      const cleanName = ensName.toLowerCase().replace('.eth', '')
      
      // Get ETH address from ENS
      const ethAddr = localStorage.getItem(`ens-to-eth-${cleanName}.eth`)
      if (!ethAddr) return null

      // Get Sui address from ETH address
      const suiAddr = localStorage.getItem(`eth-to-sui-${ethAddr}`)
      return suiAddr
    } catch (err) {
      console.error('Error resolving ENS to Sui address:', err)
      return null
    }
  }, [])

  /**
   * Get ETH address from ENS name
   */
  const getEthAddressFromEns = useCallback((ensName: string): string | null => {
    try {
      const cleanName = ensName.toLowerCase().replace('.eth', '')
      return localStorage.getItem(`ens-to-eth-${cleanName}.eth`)
    } catch (err) {
      console.error('Error resolving ENS to ETH address:', err)
      return null
    }
  }, [])

  /**
   * Get all mappings (for admin/debugging)
   */
  const getAllMappings = useCallback((): WalletMapping[] => {
    const mappings: WalletMapping[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('wallet-mapping-')) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            mappings.push(JSON.parse(value))
          }
        } catch (err) {
          console.error('Error parsing mapping:', err)
        }
      }
    }

    return mappings
  }, [])

  /**
   * Check if current wallets are mapped
   */
  const isMapped = useCallback((): boolean => {
    return currentMapping !== null
  }, [currentMapping])

  /**
   * Remove mapping
   */
  const removeMapping = useCallback(() => {
    if (!ethAddress) return

    localStorage.removeItem(`wallet-mapping-${ethAddress.toLowerCase()}`)
    
    if (currentMapping) {
      localStorage.removeItem(`ens-to-eth-${currentMapping.ensName}`)
      localStorage.removeItem(`eth-to-sui-${ethAddress.toLowerCase()}`)
    }

    setCurrentMapping(null)
    console.log('🗑️ Removed wallet mapping')
  }, [ethAddress, currentMapping])

  return {
    isLoading,
    error,
    currentMapping,
    isMapped: isMapped(),
    createMapping,
    getSuiAddressFromEns,
    getEthAddressFromEns,
    getAllMappings,
    removeMapping,
    loadMapping,
  }
}
