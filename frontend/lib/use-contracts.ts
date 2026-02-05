'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/lib/use-wallet';
import {
  createTokenTransaction,
  createSessionTransaction,
  buyInSessionTransaction,
  sellInSessionTransaction,
  type CreateTokenParams,
  type CreateSessionParams,
  type BuyInSessionParams,
  type SellInSessionParams,
} from '@/lib/sui-client';
import { getExplorerUrl } from '@/lib/contract-config';

export function useTokenLaunch() {
  const { executeTransaction, isExecuting } = useWalletConnection();
  const [launchResult, setLaunchResult] = useState<{
    digest?: string;
    explorerUrl?: string;
  } | null>(null);

  const launchToken = async (params: CreateTokenParams) => {
    const txb = createTokenTransaction(params);
    const result = await executeTransaction(
      txb,
      `Token ${params.name} launched successfully!`
    );

    if (result.success && result.digest) {
      const explorerUrl = getExplorerUrl('tx', result.digest);
      setLaunchResult({
        digest: result.digest,
        explorerUrl,
      });
    }

    return result;
  };

  return {
    launchToken,
    isLaunching: isExecuting,
    launchResult,
  };
}

export function useTradingSession() {
  const { executeTransaction, isExecuting } = useWalletConnection();

  const createSession = async (params: CreateSessionParams) => {
    const txb = createSessionTransaction(params);
    return executeTransaction(txb, 'Trading session created!');
  };

  const buyInSession = async (params: BuyInSessionParams) => {
    const txb = buyInSessionTransaction(params);
    return executeTransaction(txb, 'Buy executed successfully!');
  };

  const sellInSession = async (params: SellInSessionParams) => {
    const txb = sellInSessionTransaction(params);
    return executeTransaction(txb, 'Sell executed successfully!');
  };

  return {
    createSession,
    buyInSession,
    sellInSession,
    isExecuting,
  };
}
