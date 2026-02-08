'use client';

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { MEMEFI_CONFIG } from '@/lib/contract-config';

// Configure networks
const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

interface SuiProviderProps {
  children: ReactNode;
  queryClient: QueryClient;
}

export function SuiProvider({ children, queryClient }: SuiProviderProps) {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork={MEMEFI_CONFIG.network}>
      <WalletProvider queryClient={queryClient}>
        {children}
      </WalletProvider>
    </SuiClientProvider>
  );
}
