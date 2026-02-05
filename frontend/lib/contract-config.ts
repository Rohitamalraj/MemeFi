// MemeFi Contract Configuration
// Update these values after deploying contracts

export const MEMEFI_CONFIG = {
  // Network configuration
  network: 'testnet', // 'devnet' | 'testnet' | 'mainnet'
  
  // Contract addresses (update after deployment)
  packageId: '0x7fda7fce9169819cf03f884b023fac27ee8411ecddc45eba9686fbdcfccdd872',
  
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
  canTransfer: 'can_transfer',
  getPhase: 'get_phase',
  getWalletPurchases: 'get_wallet_purchases',
  
  // Session functions
  createSession: 'create_session',
  joinSession: 'join_session',
  buyInSession: 'buy_in_session',
  sellInSession: 'sell_in_session',
  endSession: 'end_session',
  settleSession: 'settle_session',
  getBalance: 'get_balance',
  getSessionInfo: 'get_session_info',
  getIdentity: 'get_identity',
};

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
