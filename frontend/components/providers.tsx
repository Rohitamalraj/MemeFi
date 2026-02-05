'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const SuiProvider = dynamic(
  () => import('@/components/sui-provider').then((mod) => mod.SuiProvider),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  return <SuiProvider>{children}</SuiProvider>;
}
