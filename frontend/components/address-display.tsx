'use client'

import { useEnsName } from '@/hooks/use-ens-name'

interface AddressDisplayProps {
  address?: string
  className?: string
  showFull?: boolean
}

/**
 * Component to display wallet address or ENS name
 * Automatically shows ENS name if user has one mapped, otherwise shows shortened address
 */
export function AddressDisplay({ address, className = '', showFull = false }: AddressDisplayProps) {
  const { ensName } = useEnsName()

  if (!address) return null

  // If user has ENS mapped, show it
  if (ensName) {
    return <span className={className}>{ensName}</span>
  }

  // Show full address or shortened
  if (showFull) {
    return <span className={`font-mono ${className}`}>{address}</span>
  }

  // Show shortened address
  return (
    <span className={`font-mono ${className}`}>
      {address.slice(0, 6)}...{address.slice(-4)}
    </span>
  )
}

/**
 * Get display name for any address - ENS name or shortened address
 */
export function getDisplayName(address?: string, ensName?: string): string {
  if (!address) return ''
  if (ensName) return ensName
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
