// Sui Wallet Integration
// This file provides wallet connection and transaction utilities

import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { MEMEFI_CONFIG, CONTRACT_FUNCTIONS, getFunctionName } from './contract-config';

// Initialize Sui client
export function getSuiClient(): SuiClient {
  const rpcUrl = MEMEFI_CONFIG.rpcEndpoints[MEMEFI_CONFIG.network];
  return new SuiClient({ url: rpcUrl });
}

// Token Launch Transaction
export interface CreateTokenParams {
  name: string;
  symbol: string;
  totalSupply: number;
  maxBuyPerWallet: number;
  phaseDurationMs: number;
  transfersLocked: boolean;
  decimals?: number; // Optional, defaults to 9
}

export function createTokenTransaction(params: CreateTokenParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  const decimals = params.decimals ?? 9; // Default to 9 decimals for SUI
  
  console.log('Creating token transaction with params:', {
    ...params,
    decimals,
  });
  
  // Convert strings to byte arrays
  const nameBytes = Array.from(new TextEncoder().encode(params.name));
  const symbolBytes = Array.from(new TextEncoder().encode(params.symbol));
  
  console.log('Encoded bytes:', {
    nameBytes,
    symbolBytes,
  });
  
  txb.moveCall({
    target: getFunctionName('token', CONTRACT_FUNCTIONS.createToken),
    arguments: [
      txb.pure(nameBytes, 'vector<u8>'),
      txb.pure(symbolBytes, 'vector<u8>'),
      txb.pure(decimals, 'u8'),
      txb.pure(params.totalSupply, 'u64'),
      txb.pure(params.maxBuyPerWallet, 'u64'),
      txb.pure(params.phaseDurationMs, 'u64'),
      txb.pure(params.transfersLocked, 'bool'),
    ],
  });
  
  console.log('Transaction block created:', txb);
  
  return txb;
}

// Buy Tokens Transaction
export interface BuyTokensParams {
  rulesObjectId: string;
  registryObjectId: string;
  amount: number;
}

export function buyTokensTransaction(params: BuyTokensParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('token', CONTRACT_FUNCTIONS.buyTokens),
    arguments: [
      txb.object(params.rulesObjectId),
      txb.object(params.registryObjectId),
      txb.pure(params.amount),
    ],
  });
  
  return txb;
}

// Create Session Transaction
export interface CreateSessionParams {
  name: string;
  tokenName: string;
  durationMs: number;
  tokenType: string; // Full type with package ID
}

export function createSessionTransaction(params: CreateSessionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.createSession),
    typeArguments: [params.tokenType],
    arguments: [
      txb.pure(params.name),
      txb.pure(params.tokenName),
      txb.pure(params.durationMs),
    ],
  });
  
  return txb;
}

// Join Session Transaction
export interface JoinSessionParams {
  sessionId: string;
  ensIdentity: string;
  tokenType: string;
}

export function joinSessionTransaction(params: JoinSessionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.joinSession),
    typeArguments: [params.tokenType],
    arguments: [
      txb.object(params.sessionId),
      txb.pure(params.ensIdentity),
    ],
  });
  
  return txb;
}

// Buy in Session Transaction
export interface BuyInSessionParams {
  sessionId: string;
  amount: number;
  tokenType: string;
}

export function buyInSessionTransaction(params: BuyInSessionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.buyInSession),
    typeArguments: [params.tokenType],
    arguments: [
      txb.object(params.sessionId),
      txb.pure(params.amount),
    ],
  });
  
  return txb;
}

// Sell in Session Transaction
export interface SellInSessionParams {
  sessionId: string;
  amount: number;
  tokenType: string;
}

export function sellInSessionTransaction(params: SellInSessionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.sellInSession),
    typeArguments: [params.tokenType],
    arguments: [
      txb.object(params.sessionId),
      txb.pure(params.amount),
    ],
  });
  
  return txb;
}

// Settle Session Transaction
export interface SettleSessionParams {
  sessionId: string;
  tokenType: string;
}

export function settleSessionTransaction(params: SettleSessionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.settleSession),
    typeArguments: [params.tokenType],
    arguments: [
      txb.object(params.sessionId),
    ],
  });
  
  return txb;
}

// Query Functions
export async function getWalletPurchases(
  registryObjectId: string,
  walletAddress: string
): Promise<number> {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: registryObjectId,
      options: { showContent: true },
    });
    
    // Parse the dynamic field to get wallet purchases
    // This would need proper implementation based on the table structure
    return 0; // Placeholder
  } catch (error) {
    console.error('Failed to fetch wallet purchases:', error);
    return 0;
  }
}

export async function getSessionInfo(sessionId: string) {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: sessionId,
      options: { showContent: true },
    });
    
    return object.data;
  } catch (error) {
    console.error('Failed to fetch session info:', error);
    return null;
  }
}