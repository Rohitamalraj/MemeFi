// MemeFi Contract Configuration
// Update these values after deploying contracts

export const MEMEFI_CONFIG = {
  // Network configuration
  network: 'testnet', // 'devnet' | 'testnet' | 'mainnet'
  
  // Contract addresses (update after deployment)
  packageId: '0x148a2ccb1ea99c676ed2aefd4b57ab1f96af799496ed7e1fa8c8343a5716b21c',
  
  // Module names
  modules: {
    token: 'token_v2',
    session: 'session',
  },
  
  // RPC endpoints
  rpcEndpoints: {
    devnet: 'https://fullnode.devnet.sui.io:443',
    testnet: 'https://fullnode.testnet.sui.io:443',
    mainnet: 'https://fullnode.mainnet.sui.io:443',
  },
  
  // Explorer URLs
  explorerUrls: {
    devnet: 'https://suiscan.xyz/devnet',
    testnet: 'https://suiscan.xyz/testnet',
    mainnet: 'https://suiscan.xyz/mainnet',
  },
};

// Function names for contract interactions
export const CONTRACT_FUNCTIONS = {
  // Token functions
  createToken: 'launch_token', // Entry function for creating tokens
  buyTokens: 'buy_tokens',
  advancePhase: 'advance_phase',
  settlePendingPurchase: 'settle_pending_purchase', // NEW: Settle private purchases during SETTLEMENT phase
  canTransfer: 'can_transfer',
  getPhase: 'get_phase',
  getWalletPurchases: 'get_wallet_purchases',
  
  // Session functions
  openSession: 'open_session',
  buyInSession: 'buy_in_session',
  settleSession: 'settle_session',
  createSession: 'create_session', // Legacy/alternative
  joinSession: 'join_session',
  getBalance: 'get_balance',
  getSessionInfo: 'get_session_info',
  getIdentity: 'get_identity',
};

// Session states
export const SESSION_STATES = {
  ACTIVE: 0,
  SETTLED: 1,
} as const;

// Token phases - 4-phase lifecycle
export const TOKEN_PHASES = {
  LAUNCH: 0,      // Fair-launch rules apply
  PRIVATE: 1,     // Session-based private accumulation  
  SETTLEMENT: 2,  // Sessions close, balances applied
  OPEN: 3,        // Normal public token behavior
} as const;

// Phase labels for UI
export const PHASE_LABELS = {
  [TOKEN_PHASES.LAUNCH]: 'Launch',
  [TOKEN_PHASES.PRIVATE]: 'Private',
  [TOKEN_PHASES.SETTLEMENT]: 'Settlement',
  [TOKEN_PHASES.OPEN]: 'Open',
} as const;

// Helper to get current RPC endpoint
export function getRpcEndpoint(): string {
  return MEMEFI_CONFIG.rpcEndpoints[MEMEFI_CONFIG.network];
}

// Helper to get explorer URL
export function getExplorerUrl(type: 'tx' | 'object' | 'address', id: string): string {
  const baseUrl = MEMEFI_CONFIG.explorerUrls[MEMEFI_CONFIG.network];
  return `${baseUrl}/${type}/${id}`;
}

// Helper to get full function name
export function getFunctionName(module: 'token' | 'session', fn: string): string {
  return `${MEMEFI_CONFIG.packageId}::${MEMEFI_CONFIG.modules[module]}::${fn}`;
}
