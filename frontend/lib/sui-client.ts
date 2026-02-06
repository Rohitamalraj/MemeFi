// Sui Wallet Integration
// This file provides wallet connection and transaction utilities

import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { MEMEFI_CONFIG, CONTRACT_FUNCTIONS, getFunctionName } from './contract-config';
import { getTokenImage } from './token-metadata';
import { getSuiUsdPrice, calculateMarketCapUSD, getToken24hChange } from './price-feed';

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
  
  // Clock object is a shared object at address 0x6
  txb.moveCall({
    target: getFunctionName('token', CONTRACT_FUNCTIONS.createToken),
    arguments: [
      txb.object('0x6'), // Clock
      txb.pure(nameBytes, 'vector<u8>'),
      txb.pure(symbolBytes, 'vector<u8>'),
      txb.pure(decimals, 'u8'),
      txb.pure(params.totalSupply, 'u64'),
      txb.pure(params.maxBuyPerWallet, 'u64'),
      txb.pure(params.earlyPhaseDurationMs, 'u64'), // Early phase duration (LAUNCH)
      txb.pure(params.phaseDurationMs, 'u64'), // Session phase duration (PRIVATE/SETTLEMENT/etc)
      txb.pure(params.transfersLocked, 'bool'),
    ],
  });
  
  console.log('Transaction block created:', txb);
  
  return txb;
}

// Advance Phase Transaction
export interface AdvancePhaseParams {
  tokenId: string;
}

export function advancePhaseTransaction(params: AdvancePhaseParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('token', CONTRACT_FUNCTIONS.advancePhase),
    arguments: [
      txb.object('0x6'), // Clock
      txb.object(params.tokenId),
    ],
  });
  
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
// Withdraw Tokens to Wallet Transaction
export interface WithdrawToWalletParams {
  tokenId: string;
  treasuryCapId: string; // Shared TreasuryCap object ID for wrapped tokens
  amount: number;
}

export function withdrawToWalletTransaction(params: WithdrawToWalletParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  console.log('🏦 Creating withdraw transaction:', params);
  
  txb.moveCall({
    target: `${MEMEFI_CONFIG.packageId}::token_v2::withdraw_to_wallet`,
    arguments: [
      txb.object('0x6'), // Clock
      txb.object(params.tokenId), // MemeToken object
      txb.object(params.treasuryCapId), // TreasuryCap<WRAPPED_TOKEN>
      txb.pure(params.amount, 'u64'),
    ],
  });
  
  console.log('✅ Withdraw transaction created');
  return txb;
}

// Deposit Tokens from Wallet Transaction
export interface DepositFromWalletParams {
  tokenId: string;
  treasuryCapId: string;
  coinObjectId: string; // The Coin<WRAPPED_TOKEN> object to deposit
}

export function depositFromWalletTransaction(params: DepositFromWalletParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  console.log('💰 Creating deposit transaction:', params);
  
  txb.moveCall({
    target: `${MEMEFI_CONFIG.packageId}::token_v2::deposit_from_wallet`,
    arguments: [
      txb.object('0x6'), // Clock
      txb.object(params.tokenId), // MemeToken object
      txb.object(params.treasuryCapId), // TreasuryCap<WRAPPED_TOKEN>
      txb.object(params.coinObjectId), // Coin<WRAPPED_TOKEN>
    ],
  });
  
  console.log('✅ Deposit transaction created');
  return txb;
}
// Fetch all MemeToken objects from blockchain
export interface MemeTokenData {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  maxBuyPerWallet: number;
  earlyPhaseDurationMs: number; // Duration for LAUNCH phase
  phaseDurationMs: number; // Duration for PRIVATE/SETTLEMENT/etc phases
  transfersLocked: boolean;
  currentPhase: number;
  launchTime: number;
  creator: string;
  holderCount: number;
  totalVolume: number;
  currentPrice: number; // Price in SUI
  marketCap: number; // Market cap in SUI
  priceChange24h?: number; // Calculated price change over 24h (percentage)
  imageUrl?: string; // Optional image URL from Walrus or other source
  // USD values
  suiUsdPrice?: number; // Current SUI/USD exchange rate
  currentPriceUsd?: number; // Token price in USD
  marketCapUsd?: number; // Market cap in USD
  marketCapChange24h?: number; // 24h market cap change in USD
  marketCapChangePercent24h?: number; // 24h market cap change percentage
}

// Helper to calculate actual current phase based on time
export function calculateCurrentPhase(
  launchTime: number, 
  earlyPhaseDurationMs: number, 
  phaseDurationMs: number
): number {
  const now = Date.now();
  const timeElapsed = now - launchTime;
  
  // 3-phase system with instant settlement (no SETTLEMENT phase):
  // LAUNCH: 0 to early_phase_duration_ms
  // PRIVATE: early_phase_duration_ms to early_phase_duration_ms + phase_duration_ms
  // OPEN: after early_phase_duration_ms + phase_duration_ms (instant settlement, goes directly public)
  
  if (timeElapsed < earlyPhaseDurationMs) {
    return 0; // PHASE_LAUNCH
  } else if (timeElapsed < earlyPhaseDurationMs + phaseDurationMs) {
    return 1; // PHASE_PRIVATE
  } else {
    return 3; // PHASE_OPEN (skip SETTLEMENT phase 2 - instant settlement)
  }
}

export async function getAllTokens(): Promise<MemeTokenData[]> {
  const client = getSuiClient();
  
  try {
    // Query all objects of type MemeToken
    const objectType = `${MEMEFI_CONFIG.packageId}::${MEMEFI_CONFIG.modules.token}::MemeToken`;
    
    console.log('Querying tokens of type:', objectType);
    
    const response = await client.getOwnedObjects({
      filter: {
        StructType: objectType,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    console.log('Query response:', response);
    
    const tokens: MemeTokenData[] = [];
    
    for (const item of response.data) {
      if (item.data && item.data.content && item.data.content.dataType === 'moveObject') {
        const fields = item.data.content.fields as any;
        
        tokens.push({
          id: item.data.objectId,
          name: fields.name || '',
          symbol: fields.symbol || '',
          decimals: Number(fields.decimals || 9),
          totalSupply: Number(fields.total_supply || 0),
          circulatingSupply: Number(fields.circulating_supply || 0),
          maxBuyPerWallet: Number(fields.max_buy_per_wallet || 0),
          earlyPhaseDurationMs: Number(fields.early_phase_duration_ms || 0),
          phaseDurationMs: Number(fields.phase_duration_ms || 0),
          transfersLocked: Boolean(fields.transfers_locked),
          currentPhase: Number(fields.current_phase || 0),
          launchTime: Number(fields.launch_time || 0),
          creator: fields.creator || '',
        });
        
        console.log('🪙 Token parsed:', {
          name: fields.name,
          launchTime: fields.launch_time,
          launchTimeNumber: Number(fields.launch_time || 0),
          currentPhase: fields.current_phase,
        });
      }
    }
    
    console.log('Fetched tokens:', tokens);
    
    return tokens;
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    return [];
  }
}

// Alternative method using getObject for shared objects
export async function getTokenById(tokenId: string): Promise<MemeTokenData | null> {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: tokenId,
      options: { 
        showContent: true,
        showType: true,
      },
    });
    
    if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
      return null;
    }
    
    const fields = object.data.content.fields as any;
    
    console.log('📊 Token fields:', {
      circulating_supply: fields.circulating_supply,
      total_supply: fields.total_supply,
      total_volume: fields.total_volume,
      holder_count: fields.holder_count,
      current_phase: fields.current_phase,
    });
    
    // Calculate price using bonding curve
    const circulatingSupply = Number(fields.circulating_supply || 0);
    const totalSupply = Number(fields.total_supply || 1);
    const basePrice = 0.0001; // Base price in SUI (not SOL!)
    const maxMultiplier = 100; // Max price multiplier at 100% supply
    const supplyPercent = circulatingSupply / totalSupply;
    const currentPrice = basePrice * (1 + (maxMultiplier - 1) * supplyPercent);
    
    // Market cap = circulating supply (in tokens) * current price
    // circulating_supply is already in base units (smallest denomination)
    // So we divide by 1B to get token amount, then multiply by price
    const circulatingTokens = circulatingSupply / 1_000_000_000;
    const marketCap = circulatingTokens * currentPrice;

    // Calculate volume in SUI (not just token count)
    // total_volume is in base units (tokens), convert and multiply by average price
    // For simplicity, use current price as approximation
    const volumeTokens = Number(fields.total_volume || 0) / 1_000_000_000;
    const volumeSUI = volumeTokens * currentPrice;

    console.log('💰 Calculated values:', {
      circulatingSupply,
      circulatingTokens,
      currentPrice,
      marketCap,
      volumeTokens,
      volumeSUI,
    });

    // Calculate 24h price change by comparing with initial price
    // Initial price when no supply has been sold yet
    const initialPrice = basePrice;
    const priceChange24h = ((currentPrice - initialPrice) / initialPrice) * 100;

    // Get image URL from metadata storage
    const imageUrl = getTokenImage(object.data.objectId);

    // Fetch USD prices and 24h changes
    let suiUsdPrice: number | undefined;
    let currentPriceUsd: number | undefined;
    let marketCapUsd: number | undefined;
    let marketCapChange24h: number | undefined;
    let marketCapChangePercent24h: number | undefined;

    try {
      suiUsdPrice = await getSuiUsdPrice();
      currentPriceUsd = currentPrice * suiUsdPrice;
      marketCapUsd = calculateMarketCapUSD(circulatingSupply, currentPrice, suiUsdPrice);
      
      // Get 24h change data
      const change24h = await getToken24hChange(
        object.data.objectId,
        currentPrice,
        circulatingSupply
      );
      
      marketCapChange24h = change24h.marketCapChange;
      marketCapChangePercent24h = change24h.marketCapChangePercent;
    } catch (error) {
      console.error('Failed to fetch USD data:', error);
    }

    return {
      id: object.data.objectId,
      name: fields.name || '',
      symbol: fields.symbol || '',
      decimals: Number(fields.decimals || 9),
      totalSupply: totalSupply,
      circulatingSupply: circulatingSupply,
      maxBuyPerWallet: Number(fields.max_buy_per_wallet || 0),
      earlyPhaseDurationMs: Number(fields.early_phase_duration_ms || 0),
      phaseDurationMs: Number(fields.phase_duration_ms || 0),
      transfersLocked: Boolean(fields.transfers_locked),
      currentPhase: Number(fields.current_phase || 0),
      launchTime: Number(fields.launch_time || 0),
      creator: fields.creator || '',
      holderCount: Number(fields.holder_count || 0),
      totalVolume: volumeSUI, // Volume in SUI, not token count
      currentPrice: currentPrice,
      marketCap: marketCap,
      priceChange24h: priceChange24h,
      imageUrl: imageUrl || undefined,
      // USD values
      suiUsdPrice,
      currentPriceUsd,
      marketCapUsd,
      marketCapChange24h,
      marketCapChangePercent24h,
    };
  } catch (error) {
    console.error('Failed to fetch token:', error);
    return null;
  }
}

// Get user's token balance for a specific token by querying purchase events
export async function getUserTokenBalance(tokenId: string, userAddress: string): Promise<number> {
  const client = getSuiClient();
  
  try {
    // Query all PurchaseMade events for this token
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${MEMEFI_CONFIG.packageId}::token_v2::PurchaseMade`
      },
      order: 'descending',
    });

    console.log('📊 Querying balance for token:', tokenId, 'user:', userAddress);
    console.log('📊 Found', events.data.length, 'purchase events');

    // Sum up all purchases for this user and token
    let totalBalance = 0;
    
    for (const event of events.data) {
      const parsedJson = event.parsedJson as any;
      const buyer = parsedJson.buyer;
      const eventTokenId = parsedJson.token_id;
      const amount = Number(parsedJson.amount);

      // Check if this event is for the user and token we're looking for
      if (buyer === userAddress && eventTokenId === tokenId) {
        totalBalance += amount;
        console.log('✅ Found purchase:', amount, 'tokens');
      }
    }

    // Convert from base units to tokens
    const balanceInTokens = totalBalance / 1_000_000_000;
    console.log('💼 Total balance:', balanceInTokens, 'tokens');
    
    return balanceInTokens;
  } catch (error) {
    console.error('Failed to fetch user balance:', error);
    return 0;
  }
}

// Query all TokenLaunched events to find tokens
export async function getAllTokensFromEvents(): Promise<MemeTokenData[]> {
  const client = getSuiClient();
  
  try {
    // Query TokenLaunched events
    const eventType = `${MEMEFI_CONFIG.packageId}::${MEMEFI_CONFIG.modules.token}::TokenLaunched`;
    
    console.log('Querying events of type:', eventType);
    
    const events = await client.queryEvents({
      query: {
        MoveEventType: eventType,
      },
      order: 'descending',
    });
    
    console.log('Events found:', events);
    
    const tokens: MemeTokenData[] = [];
    
    // For each event, fetch the actual token object
    for (const event of events.data) {
      const parsedJson = event.parsedJson as any;
      const tokenId = parsedJson.token_id;
      
      if (tokenId) {
        const token = await getTokenById(tokenId);
        if (token) {
          tokens.push(token);
        }
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Failed to fetch tokens from events:', error);
    return [];
  }
}

// ==================== SESSION FUNCTIONS ====================

export interface TradingSessionData {
  id: string;
  owner: address;
  state: number; // 0 = ACTIVE, 1 = SETTLED
  tokenId: string;
  balance: number;
  createdAt: number;
  // Additional fields from shared session model
  sessionName?: string;
  tokenName?: string;
  creator?: address;
  startTime?: number;
  endTime?: number;
  participants?: address[];
  volume?: number;
}

// Open a new session for a token
export interface OpenSessionParams {
  tokenId: string;
}

export function openSessionTransaction(params: OpenSessionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.openSession),
    arguments: [
      txb.object('0x6'), // Clock object
      txb.object(params.tokenId),
    ],
  });
  
  return txb;
}

// Buy tokens within a session
export interface BuyInSessionTransactionParams {
  sessionId: string;
  tokenId: string;
  amount: number;
}

export function buyInSessionTransaction(params: BuyInSessionTransactionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.buyInSession),
    arguments: [
      txb.object('0x6'), // Clock object
      txb.object(params.sessionId),
      txb.object(params.tokenId),
      txb.pure(params.amount, 'u64'),
    ],
  });
  
  return txb;
}

// Settle a session
export interface SettleSessionTransactionParams {
  sessionId: string;
  tokenId: string;
}

export function settleSessionTransaction(params: SettleSessionTransactionParams): TransactionBlock {
  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: getFunctionName('session', CONTRACT_FUNCTIONS.settleSession),
    arguments: [
      txb.object(params.sessionId),
      txb.object(params.tokenId),
    ],
  });
  
  return txb;
}

// Query all sessions for a specific wallet
export async function getSessionsForWallet(walletAddress: string): Promise<TradingSessionData[]> {
  const client = getSuiClient();
  
  try {
    // Query objects owned by wallet that are TradingSession type
    const sessionType = `${MEMEFI_CONFIG.packageId}::session::TradingSession`;
    
    console.log('🔍 Querying sessions for wallet:', walletAddress);
    console.log('🔍 Looking for type:', sessionType);
    
    const response = await client.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: sessionType,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    console.log(`✅ Found ${response.data.length} session objects for wallet:`, response);
    
    const sessions: TradingSessionData[] = [];
    
    for (const item of response.data) {
      if (item.data && item.data.content && item.data.content.dataType === 'moveObject') {
        const fields = item.data.content.fields as any;
        
        sessions.push({
          id: item.data.objectId,
          owner: fields.owner || walletAddress,
          state: Number(fields.state || 0),
          tokenId: fields.token_id || '',
          balance: Number(fields.balance || 0),
          createdAt: Number(fields.created_at || 0),
        });
      }
    }
    
    console.log(`📊 Parsed ${sessions.length} sessions from wallet`);
    
    return sessions;
  } catch (error) {
    console.error('❌ Failed to fetch sessions for wallet:', error);
    return [];
  }
}

// Query all active sessions from events
export async function getAllSessionsFromEvents(): Promise<TradingSessionData[]> {
  const client = getSuiClient();
  
  try {
    // Try multiple event types to find sessions
    const eventTypes = [
      `${MEMEFI_CONFIG.packageId}::session::SessionCreated`,
      `${MEMEFI_CONFIG.packageId}::session::SessionOpened`,
      `${MEMEFI_CONFIG.packageId}::token_v2::SessionCreated`,
    ];
    
    let allEvents: any[] = [];
    
    for (const eventType of eventTypes) {
      try {
        console.log('🔍 Querying session events of type:', eventType);
        
        const events = await client.queryEvents({
          query: {
            MoveEventType: eventType,
          },
          order: 'descending',
        });
        
        console.log(`✅ Found ${events.data.length} events for ${eventType}:`, events);
        allEvents = [...allEvents, ...events.data];
      } catch (err) {
        console.log(`⚠️ No events found for type ${eventType}:`, err);
      }
    }
    
    if (allEvents.length === 0) {
      console.log('ℹ️ No session events found. Sessions may not be deployed or created yet.');
      return [];
    }
    
    const sessions: TradingSessionData[] = [];
    
    // For each event, fetch the actual session object
    for (const event of allEvents) {
      const parsedJson = event.parsedJson as any;
      const sessionId = parsedJson.session_id;
      
      if (sessionId) {
        const session = await getSessionById(sessionId);
        if (session) {
          sessions.push(session);
        }
      }
    }
    
    console.log(`📊 Total sessions retrieved: ${sessions.length}`);
    return sessions;
  } catch (error) {
    console.error('❌ Failed to fetch sessions from events:', error);
    return [];
  }
}

// Get a specific session by ID
export async function getSessionById(sessionId: string): Promise<TradingSessionData | null> {
  const client = getSuiClient();
  
  try {
    const object = await client.getObject({
      id: sessionId,
      options: { 
        showContent: true,
        showType: true,
      },
    });
    
    if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
      return null;
    }
    
    const fields = object.data.content.fields as any;
    
    return {
      id: object.data.objectId,
      owner: fields.owner || fields.creator || '',
      state: Number(fields.state || 0),
      tokenId: fields.token_id || '',
      balance: Number(fields.balance || 0),
      createdAt: Number(fields.created_at || fields.start_time || 0),
      sessionName: fields.session_name || '',
      tokenName: fields.token_name || '',
      creator: fields.creator || '',
      startTime: Number(fields.start_time || 0),
      endTime: Number(fields.end_time || 0),
      participants: fields.participants || [],
      volume: Number(fields.volume || 0),
    };
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}