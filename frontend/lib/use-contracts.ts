'use client';

import { useState, useEffect } from 'react';
import { useWalletConnection } from '@/lib/use-wallet';
import {
  createTokenTransaction,
  advancePhaseTransaction,
  openSessionTransaction,
  buyInSessionTransaction as createBuyInSessionTx,
  settleSessionTransaction,
  getAllTokensFromEvents,
  getAllSessionsFromEvents,
  getSessionsForWallet,
  calculateCurrentPhase,
  type CreateTokenParams,
  type AdvancePhaseParams,
  type OpenSessionParams,
  type BuyInSessionTransactionParams,
  type SettleSessionTransactionParams,
  type MemeTokenData,
  type TradingSessionData,
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
  const { executeTransaction, isExecuting, address } = useWalletConnection();

  const openSession = async (params: OpenSessionParams) => {
    const txb = openSessionTransaction(params);
    return executeTransaction(txb, 'Session opened successfully!');
  };

  const buyInSession = async (params: BuyInSessionTransactionParams) => {
    const txb = createBuyInSessionTx(params);
    return executeTransaction(txb, 'Tokens purchased in session!');
  };

  const settleSession = async (params: SettleSessionTransactionParams) => {
    const txb = settleSessionTransaction(params);
    return executeTransaction(txb, 'Session settled successfully!');
  };

  const advancePhase = async (params: AdvancePhaseParams) => {
    const txb = advancePhaseTransaction(params);
    return executeTransaction(txb, 'Phase advanced successfully!');
  };

  return {
    openSession,
    buyInSession,
    settleSession,
    advancePhase,
    isExecuting,
  };
}

// Hook to fetch all tokens from blockchain
export function useTokens() {
  const [tokens, setTokens] = useState<MemeTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching tokens from blockchain...');
      const fetchedTokens = await getAllTokensFromEvents();
      console.log('Tokens fetched:', fetchedTokens);
      setTokens(fetchedTokens);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  return {
    tokens,
    isLoading,
    error,
    refetch: fetchTokens,
  };
}

// Hook to fetch tokens in PRIVATE phase (for sessions page)
export function usePrivatePhaseTokens() {
  const [tokens, setTokens] = useState<MemeTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrivateTokens = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching tokens in PRIVATE phase...');
      const allTokens = await getAllTokensFromEvents();
      
      console.log(`📊 Checking ${allTokens.length} tokens for PRIVATE phase:`);
      
      // Filter tokens that are currently in PRIVATE phase (phase 1)
      const privateTokens = allTokens.filter(token => {
        const actualPhase = calculateCurrentPhase(token.launchTime, token.earlyPhaseDurationMs, token.phaseDurationMs);
        const now = Date.now();
        const age = Math.floor((now - token.launchTime) / 1000); // age in seconds
        
        console.log(`  🪙 ${token.name} (${token.symbol}):`);
        console.log(`    - Launch time: ${token.launchTime}`);
        console.log(`    - Early phase duration: ${token.earlyPhaseDurationMs}ms (${token.earlyPhaseDurationMs / 1000}s)`);
        console.log(`    - Private Phase duration: ${token.phaseDurationMs}ms (${token.phaseDurationMs / 1000}s)`);
        console.log(`    - Age: ${age}s`);
        console.log(`    - Calculated phase: ${actualPhase}`);
        console.log(`    - Stored phase: ${token.currentPhase}`);
        
        return actualPhase === 1; // PHASE_PRIVATE
      });
      
      console.log(`✅ Found ${privateTokens.length} tokens in PRIVATE phase`);
      setTokens(privateTokens);
    } catch (err) {
      console.error('Error fetching private phase tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivateTokens();
    
    // Refresh every 30 seconds to catch phase changes
    const interval = setInterval(fetchPrivateTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    tokens,
    isLoading,
    error,
    refetch: fetchPrivateTokens,
  };
}

// Hook to fetch all sessions from blockchain (kept for compatibility)
export function useSessions() {
  const [sessions, setSessions] = useState<TradingSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useWalletConnection();

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching sessions from blockchain...');
      // Fetch all sessions from events (public sessions)
      const allSessions = await getAllSessionsFromEvents();
      console.log('All sessions fetched:', allSessions);
      
      // If wallet is connected, also fetch user's personal sessions
      if (address) {
        const userSessions = await getSessionsForWallet(address);
        console.log('User sessions fetched:', userSessions);
        
        // Merge and deduplicate
        const sessionMap = new Map<string, TradingSessionData>();
        [...allSessions, ...userSessions].forEach(session => {
          sessionMap.set(session.id, session);
        });
        
        setSessions(Array.from(sessionMap.values()));
      } else {
        setSessions(allSessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [address]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions,
  };
}
