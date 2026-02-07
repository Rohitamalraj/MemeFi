'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected, metaMask } from 'wagmi/connectors'
import { ReactNode } from 'react'

// Configure Wagmi for Ethereum/ENS support
const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected({ target: 'metaMask' }),
    metaMask(),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

interface Web3ProviderProps {
  children: ReactNode
}

/**
 * Web3Provider wraps the app with Wagmi and React Query providers
 * This enables Ethereum wallet connections and ENS functionality
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
