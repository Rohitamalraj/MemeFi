/**
 * Wallet Mapping Storage Service
 * Handles ENS → ETH → Sui wallet mappings for cross-chain transactions
 */

export interface WalletMapping {
  ensName: string
  ethAddress: string
  suiAddress: string
  timestamp: number
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  WALLET_MAPPING: (ethAddress: string) => `wallet-mapping-${ethAddress.toLowerCase()}`,
  ENS_TO_ETH: (ensName: string) => `ens-to-eth-${ensName.toLowerCase()}`,
  ETH_TO_SUI: (ethAddress: string) => `eth-to-sui-${ethAddress.toLowerCase()}`,
  USER_ENS: 'userEnsAddress', // Legacy key for backward compatibility
} as const

/**
 * Save a complete wallet mapping
 */
export function saveWalletMapping(mapping: WalletMapping): void {
  try {
    const { ensName, ethAddress, suiAddress } = mapping

    // Store complete mapping by ETH address
    localStorage.setItem(
      STORAGE_KEYS.WALLET_MAPPING(ethAddress),
      JSON.stringify(mapping)
    )

    // Store ENS → ETH lookup
    localStorage.setItem(
      STORAGE_KEYS.ENS_TO_ETH(ensName),
      ethAddress.toLowerCase()
    )

    // Store ETH → Sui lookup
    localStorage.setItem(
      STORAGE_KEYS.ETH_TO_SUI(ethAddress),
      suiAddress
    )

    // Save ENS name as user's primary identity
    localStorage.setItem(STORAGE_KEYS.USER_ENS, ensName)

    console.log('✅ Wallet mapping saved:', {
      ens: ensName,
      eth: ethAddress,
      sui: suiAddress
    })
  } catch (error) {
    console.error('❌ Error saving wallet mapping:', error)
    throw new Error('Failed to save wallet mapping')
  }
}

/**
 * Get wallet mapping by ETH address
 */
export function getWalletMapping(ethAddress: string): WalletMapping | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLET_MAPPING(ethAddress))
    if (!stored) return null

    return JSON.parse(stored) as WalletMapping
  } catch (error) {
    console.error('Error loading wallet mapping:', error)
    return null
  }
}

/**
 * Get Sui address from ENS name
 * This is the key function for cross-chain resolution
 */
export function getSuiAddressFromEns(ensName: string): string | null {
  try {
    const cleanName = ensName.toLowerCase().replace('.eth', '')
    
    // Step 1: Get ETH address from ENS
    const ethAddress = localStorage.getItem(STORAGE_KEYS.ENS_TO_ETH(`${cleanName}.eth`))
    if (!ethAddress) {
      console.log('❌ No ETH address found for ENS:', cleanName)
      return null
    }

    // Step 2: Get Sui address from ETH address
    const suiAddress = localStorage.getItem(STORAGE_KEYS.ETH_TO_SUI(ethAddress))
    if (!suiAddress) {
      console.log('❌ No Sui address mapped to ETH:', ethAddress)
      return null
    }

    console.log('✅ Resolved ENS to Sui:', {
      ens: cleanName,
      eth: ethAddress,
      sui: suiAddress
    })

    return suiAddress
  } catch (error) {
    console.error('Error resolving ENS to Sui address:', error)
    return null
  }
}

/**
 * Get ETH address from ENS name
 */
export function getEthAddressFromEns(ensName: string): string | null {
  try {
    const cleanName = ensName.toLowerCase().replace('.eth', '')
    return localStorage.getItem(STORAGE_KEYS.ENS_TO_ETH(`${cleanName}.eth`))
  } catch (error) {
    console.error('Error resolving ENS to ETH address:', error)
    return null
  }
}

/**
 * Get Sui address from ETH address
 */
export function getSuiAddressFromEth(ethAddress: string): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ETH_TO_SUI(ethAddress))
  } catch (error) {
    console.error('Error getting Sui address from ETH:', error)
    return null
  }
}

/**
 * Get ENS name for current user (if registered)
 */
export function getUserEnsName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_ENS)
  } catch (error) {
    console.error('Error getting user ENS name:', error)
    return null
  }
}

/**
 * Get all wallet mappings (for debugging/admin)
 */
export function getAllWalletMappings(): WalletMapping[] {
  const mappings: WalletMapping[] = []
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('wallet-mapping-')) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            mappings.push(JSON.parse(value))
          } catch (err) {
            console.error('Error parsing mapping:', err)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting all mappings:', error)
  }

  return mappings
}

/**
 * Remove wallet mapping
 */
export function removeWalletMapping(ethAddress: string): void {
  try {
    const mapping = getWalletMapping(ethAddress)
    
    if (mapping) {
      localStorage.removeItem(STORAGE_KEYS.WALLET_MAPPING(ethAddress))
      localStorage.removeItem(STORAGE_KEYS.ENS_TO_ETH(mapping.ensName))
      localStorage.removeItem(STORAGE_KEYS.ETH_TO_SUI(ethAddress))
      
      // Remove user ENS if it matches
      const userEns = getUserEnsName()
      if (userEns === mapping.ensName) {
        localStorage.removeItem(STORAGE_KEYS.USER_ENS)
      }

      console.log('🗑️ Wallet mapping removed:', ethAddress)
    }
  } catch (error) {
    console.error('Error removing wallet mapping:', error)
    throw new Error('Failed to remove wallet mapping')
  }
}

/**
 * Get ENS name from Sui address (reverse lookup)
 */
export function getEnsNameFromSuiAddress(suiAddress: string): string | null {
  try {
    const normalizedAddress = suiAddress.toLowerCase()
    
    // Search through all wallet mappings
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('wallet-mapping-')) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const mapping: WalletMapping = JSON.parse(value)
            if (mapping.suiAddress.toLowerCase() === normalizedAddress) {
              return mapping.ensName
            }
          } catch (err) {
            // Skip invalid entries
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting ENS name from Sui address:', error)
    return null
  }
}

/**
 * Check if an ENS name is already mapped
 */
export function isEnsMapped(ensName: string): boolean {
  const cleanName = ensName.toLowerCase().replace('.eth', '')
  return localStorage.getItem(STORAGE_KEYS.ENS_TO_ETH(`${cleanName}.eth`)) !== null
}

/**
 * Check if an ETH address has a mapping
 */
export function hasWalletMapping(ethAddress: string): boolean {
  return getWalletMapping(ethAddress) !== null
}

/**
 * Resolve address: if it's an ENS name, return the Sui address, otherwise return as-is
 * This is useful for transaction handling
 */
export function resolveToSuiAddress(addressOrEns: string): string {
  if (addressOrEns.endsWith('.eth')) {
    const suiAddress = getSuiAddressFromEns(addressOrEns)
    if (suiAddress) {
      console.log('✅ Resolved ENS to Sui for transaction:', {
        input: addressOrEns,
        resolved: suiAddress
      })
      return suiAddress
    }
    console.warn('⚠️ ENS not mapped, cannot resolve:', addressOrEns)
    throw new Error(`ENS name ${addressOrEns} is not mapped to a Sui address`)
  }
  
  // Already a Sui address
  return addressOrEns
}

/**
 * Export all storage utilities
 */
export const WalletMappingStorage = {
  save: saveWalletMapping,
  get: getWalletMapping,
  remove: removeWalletMapping,
  getAll: getAllWalletMappings,
  
  // Resolution functions
  suiFromEns: getSuiAddressFromEns,
  ethFromEns: getEthAddressFromEns,
  suiFromEth: getSuiAddressFromEth,
  ensFromSui: getEnsNameFromSuiAddress,
  resolve: resolveToSuiAddress,
  
  // Check functions
  isMapped: isEnsMapped,
  hasMapping: hasWalletMapping,
  
  // User functions
  getUserEns: getUserEnsName,
}
