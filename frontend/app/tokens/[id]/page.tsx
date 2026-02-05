'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Shield, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useWalletConnection } from '@/lib/use-wallet'
import { getSuiClient, getTokenById, MemeTokenData } from '@/lib/sui-client'
import { toast } from 'sonner'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { MEMEFI_CONFIG } from '@/lib/contract-config'

const PHASE_LABELS = ['LAUNCH', 'PRIVATE', 'SETTLEMENT', 'OPEN']

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
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

function calculateCurrentPhase(launchTime: number, phaseDurationMs: number): number {
  const now = Date.now()
  const elapsed = now - launchTime
  
  if (elapsed < phaseDurationMs) return 0 // LAUNCH
  if (elapsed < phaseDurationMs * 2) return 1 // PRIVATE
  if (elapsed < phaseDurationMs * 3) return 2 // SETTLEMENT
  return 3 // OPEN
}

export default function TokenTradingPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.id as string
  
  const { address, executeTransaction } = useWalletConnection()
  const [token, setToken] = useState<MemeTokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [isTrading, setIsTrading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)

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
      const currentPhase = calculateCurrentPhase(token.launchTime, token.phaseDurationMs)
      const phaseEndTime = token.launchTime + (token.phaseDurationMs * (currentPhase + 1))
      const remaining = Math.max(0, Math.floor((phaseEndTime - Date.now()) / 1000))
      setTimeRemaining(remaining)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [token])

  // Fetch user balance (mock for now - would query from blockchain)
  useEffect(() => {
    if (address && token) {
      // TODO: Query actual balance from blockchain
      setUserBalance(0)
    }
  }, [address, token])

  const handleTrade = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!token) return

    setIsTrading(true)

    try {
      const amountInUnits = Math.floor(parseFloat(amount) * 1_000_000_000) // Convert to base units

      if (tradeType === 'buy') {
        // Buy tokens
        const txb = new TransactionBlock()
        
        txb.moveCall({
          target: `${MEMEFI_CONFIG.packageId}::token_v2::buy_tokens`,
          arguments: [
            txb.object('0x6'), // Clock object
            txb.object(tokenId), // Token object
            txb.pure(amountInUnits, 'u64'),
          ],
        })

        const result = await executeTransaction(
          txb,
          `Successfully purchased ${parseFloat(amount).toFixed(9)} ${token.symbol}!`
        )

        if (result.success) {
          setAmount('')
          // Refresh token data
          const updatedToken = await getTokenById(tokenId)
          if (updatedToken) setToken(updatedToken)
        }
      } else {
        // Sell functionality would go here
        // Note: The current contract doesn't have a sell function
        // You would need to implement token transfer or a DEX integration
        toast.info('Sell functionality coming soon!')
      }
    } catch (error: any) {
      console.error('Trade error:', error)
      toast.error(error?.message || 'Trade failed')
    } finally {
      setIsTrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#AFFF00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#121212]/60">Loading token...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#121212]/60">Token not found</p>
          <Link href="/tokens">
            <Button className="mt-4 bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90">
              Back to Tokens
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentPhase = calculateCurrentPhase(token.launchTime, token.phaseDurationMs)
  const supplyPercent = token.totalSupply > 0 
    ? ((token.circulatingSupply / token.totalSupply) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/tokens">
          <Button variant="outline" className="mb-6 border-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tokens
          </Button>
        </Link>

        {/* Token Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-2xl flex items-center justify-center font-black text-3xl text-[#121212]">
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-4xl font-black text-[#121212] mb-2">
                  {token.name}
                </h1>
                <p className="text-xl text-[#121212]/60 font-mono">${token.symbol}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-[#121212]/60 mb-1">Current Phase</div>
              <div className="inline-flex items-center gap-2 bg-[#AFFF00] px-4 py-2 rounded-full">
                <Activity className="w-4 h-4" />
                <span className="font-bold text-[#121212]">{PHASE_LABELS[currentPhase]}</span>
              </div>
              {currentPhase < 3 && (
                <div className="text-xs text-[#121212]/60 mt-2 flex items-center gap-1">
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
            <Card className="border-2">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4">Token Stats</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-[#121212]/60 mb-1">Total Supply</div>
                    <div className="font-bold text-xl">{formatNumber(token.totalSupply)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-[#121212]/60 mb-1">Circulating Supply</div>
                    <div className="font-bold text-xl">{formatNumber(token.circulatingSupply)}</div>
                    <div className="text-xs text-[#AFFF00] mt-1">{supplyPercent}% of total</div>
                  </div>

                  <div>
                    <div className="text-sm text-[#121212]/60 mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Max Buy Per Wallet
                    </div>
                    <div className="font-bold text-xl">{formatNumber(token.maxBuyPerWallet)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-[#121212]/60 mb-1">Phase Duration</div>
                    <div className="font-bold text-lg">
                      {(token.phaseDurationMs / (1000 * 60 * 60)).toFixed(2)} hours
                    </div>
                  </div>
                </div>

                {address && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="text-sm text-[#121212]/60 mb-1">Your Balance</div>
                    <div className="font-bold text-2xl text-[#AFFF00]">
                      {formatNumber(userBalance)} {token.symbol}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Info */}
            <Card className="border-2 bg-gradient-to-br from-[#AFFF00]/10 to-[#7AB800]/10">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3">Phase Information</h3>
                <div className="space-y-3 text-sm">
                  {PHASE_LABELS.map((phase, idx) => (
                    <div
                      key={phase}
                      className={`flex items-center gap-2 ${
                        idx === currentPhase ? 'text-[#121212] font-bold' : 'text-[#121212]/40'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          idx === currentPhase ? 'bg-[#AFFF00] animate-pulse' : 'bg-gray-300'
                        }`}
                      />
                      {phase}
                      {idx === currentPhase && ' (Current)'}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trading Interface */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#121212] mb-4">Trade {token.symbol}</h2>
                  
                  {/* Buy/Sell Toggle */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      onClick={() => setTradeType('buy')}
                      className={`flex-1 font-bold ${
                        tradeType === 'buy'
                          ? 'bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90'
                          : 'bg-gray-100 text-[#121212]/60 hover:bg-gray-200'
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
                          : 'bg-gray-100 text-[#121212]/60 hover:bg-gray-200'
                      }`}
                      disabled
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Sell (Coming Soon)
                    </Button>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-[#121212] mb-2">
                      Amount ({token.symbol})
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-[#121212]/20 rounded-lg focus:border-[#AFFF00] focus:outline-none text-lg font-bold"
                      step="0.000000001"
                      min="0"
                    />
                    <div className="flex justify-between mt-2 text-xs text-[#121212]/60">
                      <span>Min: 0.000000001</span>
                      <span>Max: {formatNumber(token.maxBuyPerWallet)}</span>
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[1000, 10000, 100000, 1000000].map((val) => (
                      <Button
                        key={val}
                        onClick={() => setAmount((val / 1_000_000_000).toString())}
                        variant="outline"
                        size="sm"
                        className="border-2"
                      >
                        {formatNumber(val)}
                      </Button>
                    ))}
                  </div>

                  {/* Trade Summary */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/60">You {tradeType}</span>
                        <span className="font-bold">{parseFloat(amount).toFixed(9)} {token.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#121212]/60">Phase</span>
                        <span className="font-bold">{PHASE_LABELS[currentPhase]}</span>
                      </div>
                    </div>
                  )}

                  {/* Trade Button */}
                  <Button
                    onClick={handleTrade}
                    disabled={!address || !amount || parseFloat(amount) <= 0 || isTrading}
                    className="w-full bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold text-lg py-6"
                  >
                    {!address
                      ? 'Connect Wallet'
                      : isTrading
                      ? 'Processing...'
                      : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`}
                  </Button>

                  {/* Warning for non-OPEN phase */}
                  {currentPhase < 3 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      <strong>Note:</strong> This token is in {PHASE_LABELS[currentPhase]} phase. 
                      Max buy limit: {formatNumber(token.maxBuyPerWallet)} tokens per wallet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trading Info */}
            <Card className="border-2 mt-4">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4">How Trading Works</h3>
                <div className="space-y-3 text-sm text-[#121212]/80">
                  <div>
                    <strong>• LAUNCH Phase:</strong> Fair launch period where max buy limits apply.
                  </div>
                  <div>
                    <strong>• PRIVATE Phase:</strong> Private accumulation through sessions with limits.
                  </div>
                  <div>
                    <strong>• SETTLEMENT Phase:</strong> Sessions close and balances finalize.
                  </div>
                  <div>
                    <strong>• OPEN Phase:</strong> Full trading without restrictions.
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
