// Price Feed Integration for SUI/USD conversion
// Using Pyth Network oracle - Real-time, first-party price data

import { MEMEFI_CONFIG } from './contract-config';

// Pyth Network configuration
const PYTH_CONFIG = {
  // Hermes API endpoints
  HERMES_MAINNET: 'https://hermes.pyth.network',
  HERMES_TESTNET: 'https://hermes-beta.pyth.network',
  
  // SUI/USD price feed ID from Pyth Network
  // Source: https://docs.pyth.network/price-feeds/price-feeds
  // Note: This is the actual SUI/USD feed ID verified from Pyth docs
  SUI_USD_FEED_ID: '0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266',
  
  // Pyth contract addresses on Sui
  PYTH_STATE_MAINNET: '0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8',
  PYTH_STATE_TESTNET: '0x243759059f4c3111179da5878c12f68d612c21a8d54d85edc86164bb18be1c7c',
};

interface PythPriceData {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

interface HermesResponse {
  parsed: PythPriceData[];
}

/**
 * Fetch real-time SUI/USD price from Pyth Network via Hermes API
 * https://docs.pyth.network/price-feeds/core/fetch-price-updates
 */
export async function getSuiUsdPrice(): Promise<number> {
  try {
    // Use testnet for development, mainnet for production
    const hermesEndpoint = MEMEFI_CONFIG.network === 'mainnet' 
      ? PYTH_CONFIG.HERMES_MAINNET 
      : PYTH_CONFIG.HERMES_TESTNET;
    
    // Fetch latest price update from Hermes
    const url = `${hermesEndpoint}/v2/updates/price/latest?ids[]=${PYTH_CONFIG.SUI_USD_FEED_ID}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status}`);
    }
    
    const data: HermesResponse = await response.json();
    
    if (!data.parsed || data.parsed.length === 0) {
      throw new Error('No price data received from Pyth');
    }
    
    const priceData = data.parsed[0];
    
    // Convert price using exponent
    // Price is stored as: price * 10^expo
    // Example: price = 150000000, expo = -8 → 1.5 USD
    const price = parseInt(priceData.price.price);
    const expo = priceData.price.expo;
    const suiUsdPrice = price * Math.pow(10, expo);
    
    console.log('🔮 Pyth Network - SUI/USD Price:', suiUsdPrice.toFixed(4));
    console.log('📊 Confidence Interval:', parseInt(priceData.price.conf) * Math.pow(10, expo));
    console.log('⏰ Last Updated:', new Date(priceData.price.publish_time * 1000).toISOString());
    
    return suiUsdPrice;
  } catch (error) {
    console.error('⚠️ Failed to fetch SUI/USD price from Pyth Network:', error);
    console.log('📌 Using fallback price: $1.50');
    
    // Fallback price if Pyth API fails
    return 1.50;
  }
}

/**
 * Calculate market cap in USD
 */
export function calculateMarketCapUSD(
  circulatingSupply: number, // In base units (1B = 1 token)
  priceInSui: number, // Token price in SUI
  suiUsdPrice: number // SUI/USD exchange rate
): number {
  const circulatingTokens = circulatingSupply / 1_000_000_000;
  const marketCapSui = circulatingTokens * priceInSui;
  const marketCapUsd = marketCapSui * suiUsdPrice;
  return marketCapUsd;
}

/**
 * Format USD value for display
 */
export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.000001) return `$${value.toFixed(8)}`;
  if (value > 0) return `< $0.000001`;
  return `$0.00`;
}

/**
 * Calculate 24h change from historical data
 */
export interface MarketChange24h {
  priceChange: number; // Absolute change in USD
  priceChangePercent: number; // Percentage change
  marketCapChange: number; // Absolute change in market cap (USD)
  marketCapChangePercent: number; // Percentage change in market cap
}

export function calculate24hChange(
  currentPrice: number, // Current price in USD
  price24hAgo: number, // Price 24h ago in USD
  currentMarketCap: number, // Current market cap in USD
  marketCap24hAgo: number // Market cap 24h ago in USD
): MarketChange24h {
  const priceChange = currentPrice - price24hAgo;
  const priceChangePercent = price24hAgo > 0 
    ? (priceChange / price24hAgo) * 100 
    : 0;

  const marketCapChange = currentMarketCap - marketCap24hAgo;
  const marketCapChangePercent = marketCap24hAgo > 0
    ? (marketCapChange / marketCap24hAgo) * 100
    : 0;

  return {
    priceChange,
    priceChangePercent,
    marketCapChange,
    marketCapChangePercent,
  };
}

/**
 * Cache interface for storing price history
 */
interface PriceHistoryEntry {
  timestamp: number;
  tokenId: string;
  priceInSui: number;
  circulatingSupply: number;
  suiUsdPrice: number;
}

const PRICE_HISTORY_KEY = 'memefi_price_history';
const HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Store current price in history
 */
export function storePriceHistory(entry: PriceHistoryEntry): void {
  try {
    const history = getPriceHistory();
    history.push(entry);
    
    // Clean old entries (older than 24h)
    const cutoff = Date.now() - HISTORY_RETENTION_MS;
    const filtered = history.filter(e => e.timestamp > cutoff);
    
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to store price history:', error);
  }
}

/**
 * Get price history from localStorage
 */
export function getPriceHistory(): PriceHistoryEntry[] {
  try {
    const data = localStorage.getItem(PRICE_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load price history:', error);
    return [];
  }
}

/**
 * Get price from 24h ago for a specific token
 */
export function getPrice24hAgo(tokenId: string): PriceHistoryEntry | null {
  const history = getPriceHistory();
  const cutoff = Date.now() - HISTORY_RETENTION_MS;
  
  // Find oldest entry within 24h window for this token
  const entries = history
    .filter(e => e.tokenId === tokenId && e.timestamp > cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  return entries[0] || null;
}

/**
 * Calculate 24h change for a token using stored history
 */
export async function getToken24hChange(
  tokenId: string,
  currentPriceInSui: number,
  currentCirculatingSupply: number
): Promise<MarketChange24h> {
  try {
    const suiUsdPrice = await getSuiUsdPrice();
    
    // Store current price for future comparisons
    storePriceHistory({
      timestamp: Date.now(),
      tokenId,
      priceInSui: currentPriceInSui,
      circulatingSupply: currentCirculatingSupply,
      suiUsdPrice,
    });
    
    // Get price from 24h ago
    const historical = getPrice24hAgo(tokenId);
    
    if (!historical) {
      // No historical data yet
      return {
        priceChange: 0,
        priceChangePercent: 0,
        marketCapChange: 0,
        marketCapChangePercent: 0,
      };
    }
    
    // Calculate current values in USD
    const currentPriceUsd = currentPriceInSui * suiUsdPrice;
    const currentMarketCapUsd = calculateMarketCapUSD(
      currentCirculatingSupply,
      currentPriceInSui,
      suiUsdPrice
    );
    
    // Calculate historical values in USD
    const historicalPriceUsd = historical.priceInSui * historical.suiUsdPrice;
    const historicalMarketCapUsd = calculateMarketCapUSD(
      historical.circulatingSupply,
      historical.priceInSui,
      historical.suiUsdPrice
    );
    
    return calculate24hChange(
      currentPriceUsd,
      historicalPriceUsd,
      currentMarketCapUsd,
      historicalMarketCapUsd
    );
  } catch (error) {
    console.error('Failed to calculate 24h change:', error);
    return {
      priceChange: 0,
      priceChangePercent: 0,
      marketCapChange: 0,
      marketCapChangePercent: 0,
    };
  }
}
