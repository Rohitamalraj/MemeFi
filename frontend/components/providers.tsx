'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Web3Provider } from '@/components/web3-provider';

const SuiProvider = dynamic(
  () => import('@/components/sui-provider').then((mod) => mod.SuiProvider),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <SuiProvider queryClient={queryClient}>{children}</SuiProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}
