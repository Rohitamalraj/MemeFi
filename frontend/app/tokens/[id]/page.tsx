'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Shield, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useWalletConnection } from '@/lib/use-wallet'
import { getSuiClient, getTokenById, getUserTokenBalance, MemeTokenData, withdrawToWalletTransaction, getTopTokenHolders, TokenHolder } from '@/lib/sui-client'
import { formatUSD } from '@/lib/price-feed'
import { toast } from 'sonner'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { MEMEFI_CONFIG } from '@/lib/contract-config'
import { TradingChart } from '@/components/trading-chart'
import { getEnsNameFromSuiAddress } from '@/lib/wallet-mapping-storage'

/**
 * Token Trading Page - Displays REAL on-chain data from Sui blockchain
 * 
 * DATA SOURCES (All data is fetched from blockchain, NO mock data):
 * ✅ Token Info: name, symbol, total supply - stored on-chain
 * ✅ Circulating Supply: calculated from purchases on-chain
 * ✅ Holders Count: tracked on-chain in token.balances table
 * ✅ Total Volume: sum of all PurchaseMade events
 * ✅ Current Price: calculated using bonding curve formula based on supply
 * ✅ Market Cap: circulating supply × current price (calculated)
 * ✅ Current Phase: calculated from launch time and phase durations
 * ✅ User Balance: stored in token.balances[user_address]
 * ✅ Phase Durations: stored on-chain (earlyPhaseDurationMs, phaseDurationMs)
 * 
 * CALCULATED CLIENT-SIDE:
 * - Time remaining in phase (based on launch time + phase duration)
 * - Current phase number (LAUNCH=0, PRIVATE=1, OPEN=3)
 * - Price in SUI (prices are denominated in SUI, not SOL)
 */

const PHASE_LABELS = ['LAUNCH', 'PRIVATE', 'SETTLEMENT', 'OPEN']

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.01) return num.toFixed(4)
  if (num >= 0.000001) return num.toFixed(8)
  if (num > 0) return `< 0.000001`
  return '0.00'
}

function formatHolderAddress(address: string): string {
  const ensName = getEnsNameFromSuiAddress(address)
  if (ensName) {
    return ensName
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Ended'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

function calculateCurrentPhase(
  launchTime: number, 
  earlyPhaseDurationMs: number, 
  phaseDurationMs: number
): number {
  const now = Date.now()
  const elapsed = now - launchTime
  
  // 3-phase system: LAUNCH → PRIVATE → OPEN (instant settlement)
  if (elapsed < earlyPhaseDurationMs) return 0 // LAUNCH
  if (elapsed < earlyPhaseDurationMs + phaseDurationMs) return 1 // PRIVATE
  return 3 // OPEN (instant settlement, skip phase 2)
}

export default function TokenTradingPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.id as string
  
  const { address, executeTransaction } = useWalletConnection()
  const [token, setToken] = useState<MemeTokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [suiAmount, setSuiAmount] = useState('') // Changed from token amount to SUI amount
  const [isTrading, setIsTrading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [holders, setHolders] = useState<TokenHolder[]>([])
  const [loadingHolders, setLoadingHolders] = useState(true)
  const [lastTxDigest, setLastTxDigest] = useState<string | null>(null)

  // Fetch token data
  useEffect(() => {
    async function fetchToken() {
      try {
        const tokenData = await getTokenById(tokenId)
        if (tokenData) {
          setToken(tokenData)
        } else {
          toast.error('Token not found')
          router.push('/tokens')
        }
      } catch (error) {
        console.error('Error fetching token:', error)
        toast.error('Failed to load token')
      } finally {
        setLoading(false)
      }
    }
    fetchToken()
  }, [tokenId, router])

  // Update time remaining
  useEffect(() => {
    if (!token) return
    
    const updateTimer = () => {
      const currentPhase = calculateCurrentPhase(token.launchTime, token.earlyPhaseDurationMs, token.phaseDurationMs)
      
      // Calculate phase end time for 3-phase system (no SETTLEMENT)
      let phaseEndTime: number
      if (currentPhase === 0) {
        // LAUNCH phase ends after early phase duration
        phaseEndTime = token.launchTime + token.earlyPhaseDurationMs
      } else if (currentPhase === 1) {
        // PRIVATE phase ends after early + phase duration (then instant settlement to OPEN)
        phaseEndTime = token.launchTime + token.earlyPhaseDurationMs + token.phaseDurationMs
      } else {
        // OPEN phase has no end
        phaseEndTime = Date.now()
      }
      
      const remaining = Math.max(0, Math.floor((phaseEndTime - Date.now()) / 1000))
      setTimeRemaining(remaining)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [token])

  // Fetch user balance from blockchain
  useEffect(() => {
    async function fetchBalance() {
      if (address && token) {
        const balance = await getUserTokenBalance(token.id, address)
        setUserBalance(balance)
      }
    }
    fetchBalance()
  }, [address, token])

  // Fetch top holders
  useEffect(() => {
    async function fetchHolders() {
      if (token) {
        setLoadingHolders(true)
        const topHolders = await getTopTokenHolders(token.id, 20)
        setHolders(topHolders)
        setLoadingHolders(false)
      }
    }
    fetchHolders()
  }, [token])

  const handleTrade = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!suiAmount || parseFloat(suiAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!token) return

    setIsTrading(true)

    try {
      if (tradeType === 'buy') {
        // Buy tokens with SUI payment
        const txb = new TransactionBlock()
        
        // Convert SUI amount to MIST (smallest unit: 1 SUI = 1,000,000,000 MIST)
        const suiAmountMist = Math.floor(parseFloat(suiAmount) * 1_000_000_000)
        
        // Split coins from user's wallet to pay for tokens
        const [paymentCoin] = txb.splitCoins(
          txb.gas,
          [txb.pure(suiAmountMist, 'u64')]
        )
        
        // Call buy_tokens with SUI payment
        txb.moveCall({
          target: `${MEMEFI_CONFIG.packageId}::token_v2::buy_tokens`,
          arguments: [
            txb.object('0x6'), // Clock object
            txb.object(tokenId), // Token object
            paymentCoin, // Coin<SUI> payment
          ],
        })

        const result = await executeTransaction(
          txb,
          `Successfully purchased tokens for ${parseFloat(suiAmount).toFixed(4)} SUI!`
        )

        if (result.success) {
          // Store transaction digest for block explorer link
          if (result.digest) {
            setLastTxDigest(result.digest)
          }
          
          setSuiAmount('')
          // Refresh token data and balance
          const updatedToken = await getTokenById(tokenId)
          if (updatedToken) setToken(updatedToken)
          
          // Refresh user balance
          if (address) {
            const balance = await getUserTokenBalance(tokenId, address)
            setUserBalance(balance)
          }
        }
      } else {
        // Sell tokens back to bonding curve
        const tokensToSell = parseFloat(suiAmount) / token.currentPrice
        
        // Check balance BEFORE converting to base units
        if (tokensToSell > userBalance) {
          toast.error('Insufficient token balance')
          return
        }
        
        const amountInUnits = Math.floor(tokensToSell * 1_000_000_000) // Convert to base units

        const txb = new TransactionBlock()
        
        txb.moveCall({
          target: `${MEMEFI_CONFIG.packageId}::token_v2::sell_tokens`,
          arguments: [
            txb.object('0x6'), // Clock object
            txb.object(tokenId), // Token object
            txb.pure(amountInUnits, 'u64'), // Amount to sell
          ],
        })

        const result = await executeTransaction(
          txb,
          `Successfully sold ${formatNumber(tokensToSell)} ${token.symbol}!`
        )

        if (result.success) {
          // Store transaction digest for block explorer link
          if (result.digest) {
            setLastTxDigest(result.digest)
          }
          
          setSuiAmount('')
          // Refresh token data and balance
          const updatedToken = await getTokenById(tokenId)
          if (updatedToken) setToken(updatedToken)
          
          // Refresh user balance
          if (address) {
            const balance = await getUserTokenBalance(tokenId, address)
            setUserBalance(balance)
          }
        }
      }
    } catch (error: any) {
      console.error('Trade error:', error)
      toast.error(error?.message || 'Trade failed')
    } finally {
      setIsTrading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!token || !userBalance || userBalance === 0) {
      toast.error('No balance to withdraw')
      return
    }

    setIsTrading(true)

    try {
      // TreasuryCap object ID from wrapped_token deployment
      const TREASURY_CAP_ID = '0xad89b22690d8f9b464a53c4963b61e5c52fc42510184a26f6da697db68c227f2'

      const txb = new TransactionBlock()
      
      txb.moveCall({
        target: `${MEMEFI_CONFIG.packageId}::token_v2::withdraw_to_wallet`,
        arguments: [
          txb.object('0x6'), // Clock
          txb.object(tokenId), // Token object
          txb.object(TREASURY_CAP_ID), // TreasuryCap<WRAPPED_TOKEN>
          txb.pure(userBalance, 'u64'), // Withdraw full balance
        ],
      })

      const result = await executeTransaction(
        txb,
        `Successfully withdrew ${formatNumber(userBalance)} ${token.symbol} to your wallet!`
      )

      if (result.success) {
        // Store transaction digest for block explorer link
        if (result.digest) {
          setLastTxDigest(result.digest)
        }
        
        // Refresh token data and balance
        const updatedToken = await getTokenById(tokenId)
        if (updatedToken) setToken(updatedToken)
        
        // Refetch user balance from blockchain
        if (address) {
          const balance = await getUserTokenBalance(tokenId, address)
          setUserBalance(balance)
        }
      }
    } catch (error: any) {
      console.error('Withdraw error:', error)
      toast.error(error?.message || 'Withdrawal failed')
    } finally {
      setIsTrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#AFFF00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading token...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Token not found</p>
          <Link href="/tokens">
            <Button className="mt-4 bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90">
              Back to Tokens
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentPhase = calculateCurrentPhase(token.launchTime, token.earlyPhaseDurationMs, token.phaseDurationMs)
  const supplyPercent = token.totalSupply > 0 
    ? ((token.circulatingSupply / token.totalSupply) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 pt-32 md:pt-36 pb-8">
        {/* Back Button - Sticky with enhanced visibility */}
        <div className="sticky top-20 md:top-24 z-40 -mx-4 px-4 py-4 mb-6 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a] to-transparent">
          <Link href="/tokens">
            <Button 
              variant="outline" 
              className="border-2 border-[#AFFF00] bg-[#0a0a0a] text-[#AFFF00] hover:bg-[#AFFF00] hover:text-[#121212] font-bold transition-all duration-200 shadow-lg shadow-[#AFFF00]/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tokens
            </Button>
          </Link>
        </div>

        {/* Token Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {token.imageUrl ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#AFFF00]/30">
                  <img 
                    src={token.imageUrl} 
                    alt={token.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-20 h-20 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-2xl flex items-center justify-center font-black text-3xl text-[#121212]">
                    {token.symbol.slice(0, 2)}
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-2xl flex items-center justify-center font-black text-3xl text-[#121212]">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-black text-white mb-2">
                  {token.name}
                </h1>
                <p className="text-xl text-gray-400 font-mono">${token.symbol}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Current Phase</div>
              <div className="inline-flex items-center gap-2 bg-[#AFFF00] px-4 py-2 rounded-full">
                <Activity className="w-4 h-4" />
                <span className="font-bold text-[#121212]">{PHASE_LABELS[currentPhase]}</span>
              </div>
              {currentPhase < 3 && (
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeRemaining(timeRemaining)} remaining
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Market Stats Card */}
            <Card className="border-2 border-gray-800 bg-gradient-to-br from-[#AFFF00]/5 to-[#0f0f0f]">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-[#AFFF00]" />
                  Market Stats
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Market Cap</div>
                    <div className="font-black text-2xl text-[#AFFF00]">
                      {token.marketCapUsd ? formatUSD(token.marketCapUsd) : `${formatNumber(token.marketCap)} SUI`}
                    </div>
                    {token.marketCapChange24h !== undefined && token.marketCapChangePercent24h !== undefined && (
                      <div className={`text-sm mt-1 flex items-center gap-1 ${
                        token.marketCapChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {token.marketCapChange24h >= 0 ? '+' : ''}{formatUSD(token.marketCapChange24h)}
                        {' '}({token.marketCapChange24h >= 0 ? '+' : ''}{token.marketCapChangePercent24h.toFixed(2)}%) 24hr
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current Price</div>
                    <div className="font-bold text-xl text-white">
                      {token.currentPriceUsd ? formatUSD(token.currentPriceUsd) : `${token.currentPrice.toFixed(6)} SUI`}
                    </div>
                    {token.suiUsdPrice && (
                      <div className="text-xs text-gray-400 mt-1">
                        {token.currentPrice.toFixed(6)} SUI (${token.suiUsdPrice.toFixed(2)}/SUI)
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Holders
                      </div>
                      <div className="font-bold text-xl text-white">{token.holderCount.toLocaleString()}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Volume
                      </div>
                      <div className="font-bold text-xl text-white">{formatNumber(token.totalVolume)} SUI</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Info Card */}
            <Card className="border-2 border-gray-800 bg-[#0f0f0f]">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4 text-white">Token Info</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Supply</div>
                    <div className="font-bold text-xl text-white">{formatNumber(token.totalSupply)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Circulating Supply</div>
                    <div className="font-bold text-xl text-white">{formatNumber(token.circulatingSupply)}</div>
                    <div className="text-xs text-[#AFFF00] mt-1">{supplyPercent}% of total</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Max Buy Per Wallet
                    </div>
                    <div className="font-bold text-xl text-white">{formatNumber(token.maxBuyPerWallet)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Phase Duration</div>
                    <div className="font-bold text-lg text-white">
                      {(token.phaseDurationMs / (1000 * 60 * 60)).toFixed(2)} hours
                    </div>
                  </div>
                </div>

                {address && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Your Balance</div>
                    <div className="font-bold text-2xl text-[#AFFF00]">
                      {formatNumber(userBalance)} {token.symbol}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Info */}
            <Card className="border-2 border-gray-800 bg-gradient-to-br from-[#AFFF00]/5 to-[#0f0f0f]">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-white">Phase Information</h3>
                <div className="space-y-3 text-sm">
                  {PHASE_LABELS.map((phase, idx) => (
                    <div
                      key={phase}
                      className={`flex items-center gap-2 ${
                        idx === currentPhase ? 'text-white font-bold' : 'text-gray-500'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          idx === currentPhase ? 'bg-[#AFFF00] animate-pulse' : 'bg-gray-700'
                        }`}
                      />
                      {phase}
                      {idx === currentPhase && ' (Current)'}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Holders Card */}
            <Card className="border-2 border-gray-800 bg-[#0f0f0f]">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Holders
                </h3>
                
                {loadingHolders ? (
                  <div className="text-center py-8 text-gray-400">Loading holders...</div>
                ) : holders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No holders yet</div>
                ) : (
                  <div className="space-y-2">
                    {holders.map((holder, index) => (
                      <div
                        key={holder.address}
                        className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-[#AFFF00]/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            index === 2 ? 'bg-orange-500/20 text-orange-500' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-mono text-sm text-white">
                              {formatHolderAddress(holder.address)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatNumber(holder.balance)} {token.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#AFFF00]">
                            {holder.percentage.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdraw to Wallet Card - Only show in OPEN phase with balance */}
            {currentPhase === 3 && address && userBalance > 0 && (
              <Card className="border-2 border-green-800 bg-gradient-to-br from-green-900/10 to-[#0f0f0f]">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2">
                    💰 Withdraw to Wallet
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Convert your platform balance to wallet-owned Sui Coins. 
                    Your tokens will appear in your wallet and can be freely transferred.
                  </p>
                  
                  <div className="bg-[#1a1a1a] rounded-lg p-3 mb-4 border border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Available Balance</span>
                      <span className="font-bold text-white">{formatNumber(userBalance)} {token.symbol}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={isTrading}
                    className="w-full bg-green-600 text-white hover:bg-green-700 font-bold disabled:opacity-50"
                  >
                    {isTrading ? 'Processing...' : `Withdraw All ${token.symbol}`}
                  </Button>

                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
                    <strong>ℹ️ Note:</strong> Tokens will be wrapped as standard Sui Coins. 
                    This is BETA feature - withdraw at your own risk. Ensure you have enough SUI for gas fees.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Chart & Trading Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trading Chart */}
            <TradingChart
              tokenId={tokenId}
              tokenSymbol={token.symbol}
              currentPhase={currentPhase}
              isPrivatePhase={currentPhase === 1}
              intervalMinutes={1}
              marketCap={token.marketCap}
              marketCapUsd={token.marketCapUsd}
              marketCapChange24h={token.marketCapChange24h}
              marketCapChangePercent24h={token.marketCapChangePercent24h}
              totalVolume={token.totalVolume}
              currentPrice={token.currentPrice}
              currentPriceUsd={token.currentPriceUsd}
              suiUsdPrice={token.suiUsdPrice}
            />

            {/* Trading Card */}
            <Card className="border-2 border-gray-800 bg-[#0f0f0f]">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white mb-4">Trade {token.symbol}</h2>
                  
                  {/* Buy/Sell Toggle */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      onClick={() => setTradeType('buy')}
                      className={`flex-1 font-bold ${
                        tradeType === 'buy'
                          ? 'bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                    <Button
                      onClick={() => setTradeType('sell')}
                      className={`flex-1 font-bold ${
                        tradeType === 'sell'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Sell
                    </Button>
                  </div>

                  {/* SUI Amount Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-white mb-2">
                      {tradeType === 'buy' ? 'Pay with SUI' : 'Receive SUI'}
                    </label>
                    <input
                      type="number"
                      value={suiAmount}
                      onChange={(e) => setSuiAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-4 py-3 border-2 border-gray-700 bg-[#1a1a1a] text-white rounded-lg focus:border-[#AFFF00] focus:outline-none text-lg font-bold"
                      step="0.001"
                      min="0"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Min: 0.001 SUI</span>
                      <span>balance: 0 SUI</span>
                    </div>
                  </div>

                  {/* Quick SUI Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[0.1, 0.5, 1, 5].map((val) => (
                      <Button
                        key={val}
                        onClick={() => setSuiAmount(val.toString())}
                        variant="outline"
                        size="sm"
                        className="border-2 border-gray-700 bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] font-bold"
                      >
                        {val} SUI
                      </Button>
                    ))}
                  </div>

                  {/* Token Amount Preview */}
                  {suiAmount && parseFloat(suiAmount) > 0 && (
                    <div className="bg-gradient-to-r from-[#AFFF00]/10 to-[#AFFF00]/5 rounded-lg p-4 mb-4 border border-[#AFFF00]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {tradeType === 'buy' ? 'You will receive' : 'You will send'}
                        </span>
                        <div className="text-right">
                          <div className="text-xl font-black text-[#AFFF00]">
                            {formatNumber(parseFloat(suiAmount) / token.currentPrice)} {token.symbol}
                          </div>
                          <div className="text-xs text-gray-400">
                            @ {token.currentPrice.toFixed(8)} SUI per token
                          </div>
                        </div>
                      </div>
                    </div>
                  )}



                  {/* Trade Button */}
                  <Button
                    onClick={handleTrade}
                    disabled={!address || !suiAmount || parseFloat(suiAmount) <= 0 || isTrading || currentPhase === 0}
                    className="w-full bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!address
                      ? 'Connect Wallet'
                      : currentPhase === 0
                      ? 'Trading Starts in Private Phase'
                      : isTrading
                      ? 'Processing...'
                      : suiAmount && parseFloat(suiAmount) > 0
                      ? `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${formatNumber(parseFloat(suiAmount) / token.currentPrice)} ${token.symbol}`
                      : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`}
                  </Button>

                  {/* Block Explorer Link */}
                  {lastTxDigest && (
                    <div className="mt-4 p-4 bg-[#AFFF00]/10 border-2 border-[#AFFF00]/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-[#AFFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[#AFFF00] mb-1">Transaction Successful!</div>
                          <p className="text-sm text-gray-300 mb-2">
                            View your transaction on the block explorer:
                          </p>
                          <a
                            href={`https://suiscan.xyz/testnet/tx/${lastTxDigest}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[#AFFF00] hover:text-[#AFFF00]/80 underline break-all"
                          >
                            <span className="font-mono">{lastTxDigest.slice(0, 20)}...{lastTxDigest.slice(-20)}</span>
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 0 (LAUNCH) - No Trading Banner */}
                  {currentPhase === 0 && (
                    <div className="mt-4 p-4 bg-blue-900/20 border-2 border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-blue-300 mb-1">Early LAUNCH Phase</div>
                          <p className="text-sm text-blue-200">
                            Trading is not available during the early launch phase. Please wait for the <strong>PRIVATE phase</strong> to start buying tokens with complete privacy protection.
                          </p>
                          <div className="mt-2 text-xs text-blue-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Private phase starts in: {formatTimeRemaining(timeRemaining)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 1 (PRIVATE) - Go to Sessions Page */}
                  {currentPhase === 1 && (
                    <div className="mt-4 p-4 bg-purple-900/20 border-2 border-purple-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-bold text-purple-300 mb-1">🔒 Private Trading Phase Active</div>
                          <p className="text-sm text-purple-200 mb-3">
                            This token is now in the PRIVATE phase with complete privacy protection. All trades are hidden from MEV bots and whales. Go to the Sessions page to buy.
                          </p>
                          <Link href="/sessions">
                            <Button className="bg-purple-600 text-white hover:bg-purple-700 w-full font-bold">
                              Go to Private Sessions →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 3 (OPEN) - Public Trading */}
                  {currentPhase === 3 && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-sm text-green-300">
                      <strong>✅ Public Trading Open:</strong> This token is now in the OPEN phase with unrestricted trading. No buy limits apply.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trading Info */}
            <Card className="border-2 border-gray-800 bg-[#0f0f0f] mt-4">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4 text-white">How Trading Works</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <strong className="text-white">• LAUNCH Phase:</strong> Early launch period. Trading NOT available - wait for Private phase.
                  </div>
                  <div>
                    <strong className="text-white">• PRIVATE Phase:</strong> 🔒 Private trading available! Buy tokens with complete privacy. All trades are hidden until the phase ends. Max buy limits apply. Go to Sessions page.
                  </div>
                  <div>
                    <strong className="text-white">• OPEN Phase:</strong> Public trading with NO restrictions! Settlement happens instantly when private phase ends. Token moves to Tokens page. No buy limits.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
