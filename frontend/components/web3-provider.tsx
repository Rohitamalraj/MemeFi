'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { ReactNode } from 'react'

// Configure Wagmi for Ethereum/ENS support
const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

interface Web3ProviderProps {
  children: ReactNode
}

/**
 * Web3Provider wraps the app with Wagmi for Ethereum/ENS support
 * QueryClient is provided by the parent Providers component
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}
