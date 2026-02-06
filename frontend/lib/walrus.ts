/**
 * Walrus Decentralized Storage Integration
 * 
 * Walrus is a decentralized storage network on Sui for storing blobs like images.
 * 
 * Testnet endpoints:
 * - Aggregator: https://aggregator.walrus-testnet.walrus.space
 * - Publisher: https://publisher.walrus-testnet.walrus.space
 */

// Walrus configuration
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space'
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space'

export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string
      storedEpoch: number
      blobId: string
      size: number
      erasureCodeType: string
      certifiedEpoch: number
      storage: {
        id: string
        startEpoch: number
        endEpoch: number
        storageSize: number
      }
    }
    encodedSize: number
    cost: number
  }
  alreadyCertified?: {
    blobId: string
    event: {
      txDigest: string
      eventSeq: string
    }
    endEpoch: number
  }
}

/**
 * Upload a file to Walrus decentralized storage
 * @param file - The file to upload
 * @param epochs - Number of epochs to store (default: 1)
 * @returns Blob ID for retrieval
 */
export async function uploadToWalrus(
  file: File,
  epochs: number = 1
): Promise<string> {
  try {
    console.log('📤 Uploading to Walrus:', file.name, `(${file.size} bytes)`)

    // Correct endpoint according to Walrus HTTP API docs: /v1/blobs
    const uploadUrl = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;
    
    console.log('📍 Uploading to:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
    })
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Walrus upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      })
      
      throw new Error(
        `Walrus upload failed (${response.status}). ` +
        `The Walrus testnet may be temporarily unavailable. ` +
        `Please use a direct image URL as a fallback.`
      )
    }

    const result: WalrusUploadResponse = await response.json()
    console.log('✅ Walrus upload response:', result)

    // Extract blob ID from response
    let blobId: string

    if (result.newlyCreated) {
      blobId = result.newlyCreated.blobObject.blobId
      console.log('✅ New blob created:', blobId)
    } else if (result.alreadyCertified) {
      blobId = result.alreadyCertified.blobId
      console.log('✅ Blob already exists:', blobId)
    } else {
      throw new Error('Unexpected Walrus response format')
    }

    return blobId
  } catch (error) {
    console.error('❌ Walrus upload error:', error)
    throw error
  }
}

/**
 * Get the retrieval URL for a Walrus blob
 * @param blobId - The blob ID returned from upload
 * @returns Full URL to retrieve the blob
 */
export function getWalrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`
}

/**
 * Validate if a file is suitable for upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB (default: 10MB)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.',
    }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    }
  }

  return { valid: true }
}

/**
 * Upload image and return Walrus URL
 * @param file - The image file to upload
 * @param epochs - Number of epochs to store
 * @returns Full Walrus retrieval URL
 */
export async function uploadImage(
  file: File,
  epochs: number = 1
): Promise<string> {
  // Validate file
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Upload to Walrus
  const blobId = await uploadToWalrus(file, epochs)

  // Return retrieval URL
  return getWalrusUrl(blobId)
}

/**
 * Check if a URL is a Walrus URL
 * @param url - URL to check
 * @returns true if it's a Walrus URL
 */
export function isWalrusUrl(url: string): boolean {
  return url.includes('walrus-testnet.walrus.space') || url.includes('walrus.space')
}
