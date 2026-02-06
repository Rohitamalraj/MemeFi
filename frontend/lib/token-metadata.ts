/**
 * Token Metadata Storage
 * 
 * Stores and retrieves token metadata (like images) that aren't stored on-chain.
 * Uses localStorage for client-side persistence.
 */

export interface TokenMetadata {
  tokenId: string
  imageUrl?: string
  description?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'memefi_token_metadata'

/**
 * Get all token metadata from localStorage
 */
function getAllMetadata(): Record<string, TokenMetadata> {
  if (typeof window === 'undefined') return {}
  
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Error reading token metadata:', error)
    return {}
  }
}

/**
 * Save all token metadata to localStorage
 */
function saveAllMetadata(metadata: Record<string, TokenMetadata>): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata))
  } catch (error) {
    console.error('Error saving token metadata:', error)
  }
}

/**
 * Get metadata for a specific token
 * @param tokenId - The token ID
 * @returns Token metadata or null if not found
 */
export function getTokenMetadata(tokenId: string): TokenMetadata | null {
  const allMetadata = getAllMetadata()
  return allMetadata[tokenId] || null
}

/**
 * Save metadata for a specific token
 * @param tokenId - The token ID
 * @param metadata - Partial metadata to save/update
 */
export function saveTokenMetadata(
  tokenId: string,
  metadata: Partial<Omit<TokenMetadata, 'tokenId' | 'createdAt' | 'updatedAt'>>
): void {
  const allMetadata = getAllMetadata()
  const existing = allMetadata[tokenId]
  const now = Date.now()
  
  allMetadata[tokenId] = {
    ...existing,
    ...metadata,
    tokenId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  
  saveAllMetadata(allMetadata)
}

/**
 * Get image URL for a token
 * @param tokenId - The token ID
 * @returns Image URL or null if not found
 */
export function getTokenImage(tokenId: string): string | null {
  const metadata = getTokenMetadata(tokenId)
  return metadata?.imageUrl || null
}

/**
 * Save image URL for a token (typically after uploading to Walrus)
 * @param tokenId - The token ID
 * @param imageUrl - The Walrus URL or other image URL
 */
export function saveTokenImage(tokenId: string, imageUrl: string): void {
  saveTokenMetadata(tokenId, { imageUrl })
  console.log(`💾 Saved image for token ${tokenId}:`, imageUrl)
}

/**
 * Delete metadata for a specific token
 * @param tokenId - The token ID
 */
export function deleteTokenMetadata(tokenId: string): void {
  const allMetadata = getAllMetadata()
  delete allMetadata[tokenId]
  saveAllMetadata(allMetadata)
}

/**
 * Clear all token metadata (use with caution)
 */
export function clearAllMetadata(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
