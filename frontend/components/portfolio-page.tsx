"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Wallet, TrendingUp, Clock, ExternalLink, Activity, DollarSign, Globe, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWalletConnection } from "@/lib/use-wallet"
import { getSuiClient, getTokenById } from "@/lib/sui-client"
import { MEMEFI_CONFIG } from "@/lib/contract-config"
import { useWalletMapping } from "@/hooks/use-wallet-mapping"
import { ENSRegistrationModal } from "@/components/ens-registration-modal"
import { InvestmentPieChart } from "@/components/investment-pie-chart"

interface TokenHolding {
  tokenId: string
  tokenName: string
  tokenSymbol: string
  balance: number
  currentPrice: number
  value: number
  imageUrl?: string
  priceChange24h?: number
  // Investment tracking
  totalInvested: number
  averagePrice: number
  profitLoss: number
  profitLossPercent: number
}

interface Transaction {
  digest: string
  timestamp: number
  tokenName: string
  tokenSymbol: string
  amount: number
  price: number
  totalCost: number
  type: 'buy' | 'sell'
}

interface WalletBalance {
  sui: number
  tokens: number
  total: number
}

interface PortfolioStats {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercent: number
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function PortfolioPage() {
  const { address, isConnected } = useWalletConnection()
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ sui: 0, tokens: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalInvested: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercent: 0
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isEnsModalOpen, setIsEnsModalOpen] = useState(false)
  const { currentMapping, isMapped } = useWalletMapping()

  // Fetch SUI balance
  const fetchSuiBalance = useCallback(async () => {
    if (!address) return 0
    try {
      const client = getSuiClient()
      const balance = await client.getBalance({ owner: address })
      return Number(balance.totalBalance) / 1_000_000_000 // Convert from MIST to SUI
    } catch (error) {
      console.error('Error fetching SUI balance:', error)
      return 0
    }
  }, [address])

  // Enhanced portfolio fetching with SUI balance and better error handling
  const fetchPortfolio = useCallback(async (showRefreshIndicator = false) => {
    if (!address) {
      setLoading(false)
      return
    }

    if (showRefreshIndicator) {
      setRefreshing(true)
    }

    try {
      const client = getSuiClient()

      // Fetch SUI balance and purchase events in parallel
      const [suiBalance, events] = await Promise.all([
        fetchSuiBalance(),
        client.queryEvents({
          query: {
            MoveEventType: `${MEMEFI_CONFIG.packageId}::token_v2::PurchaseMade`
          },
          order: 'descending',
        })
      ])

      console.log('📊 Fetched events:', events.data.length)
      console.log('💰 SUI Balance:', suiBalance)

      // Group by token to calculate holdings and investment details
      const holdingsMap = new Map<string, { 
        balance: number; 
        txs: Array<{ digest: string; timestamp: number; amount: number; suiSpent: number }>
      }>()
      const transactionsList: Transaction[] = []

      // Process purchase events
      for (const event of events.data) {
        const parsedJson = event.parsedJson as any
        const buyer = parsedJson.buyer
        const tokenId = parsedJson.token_id
        const amount = Number(parsedJson.token_amount) / 1_000_000_000 // Convert from smallest unit to tokens
        const suiAmount = Number(parsedJson.sui_paid) / 1_000_000_000 // Convert from MIST to SUI
        const timestamp = Number(event.timestampMs)

        console.log('🔍 Processing event:', { buyer, tokenId, amount, suiAmount, userAddress: address })

        // Only include transactions for this user
        if (buyer === address) {
          if (!holdingsMap.has(tokenId)) {
            holdingsMap.set(tokenId, { balance: 0, txs: [] })
          }

          const holding = holdingsMap.get(tokenId)!
          holding.balance += amount
          holding.txs.push({
            digest: event.id.txDigest,
            timestamp,
            amount,
            suiSpent: suiAmount,
          })
        }
      }

      console.log('💎 Holdings map size:', holdingsMap.size)
      console.log('💎 Holdings map entries:', Array.from(holdingsMap.entries()))

      // Fetch token details for each token with current prices
      const holdingsArray: TokenHolding[] = []
      let totalTokenValue = 0
      let totalInvested = 0

      for (const [tokenId, data] of holdingsMap.entries()) {
        try {
          console.log('🔍 Processing token:', { tokenId, balance: data.balance })
          
          const token = await getTokenById(tokenId)
          console.log('📊 Token data:', token)
          
          if (token && data.balance > 0) {
            const currentValue = data.balance * token.currentPrice
            const invested = data.txs.reduce((sum, tx) => sum + tx.suiSpent, 0)
            const averagePrice = invested / data.balance
            const profitLoss = currentValue - invested
            const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0
            
            totalTokenValue += currentValue
            totalInvested += invested

            holdingsArray.push({
              tokenId,
              tokenName: token.name,
              tokenSymbol: token.symbol,
              balance: data.balance,
              currentPrice: token.currentPrice,
              value: currentValue,
              imageUrl: token.imageUrl,
              priceChange24h: Math.random() * 20 - 10, // Simulated until real price API
              totalInvested: invested,
              averagePrice: averagePrice,
              profitLoss: profitLoss,
              profitLossPercent: profitLossPercent,
            })

            // Add transactions for this token
            for (const tx of data.txs) {
              transactionsList.push({
                digest: tx.digest,
                timestamp: tx.timestamp,
                tokenName: token.name,
                tokenSymbol: token.symbol,
                amount: tx.amount,
                price: tx.suiSpent / tx.amount,
                totalCost: tx.suiSpent,
                type: 'buy'
              })
            }
          }
        } catch (error) {
          console.error(`Error fetching token ${tokenId}:`, error)
        }
      }

      // Sort holdings by value (descending)
      holdingsArray.sort((a, b) => b.value - a.value)
      
      // Sort transactions by timestamp (most recent first)
      transactionsList.sort((a, b) => b.timestamp - a.timestamp)

      const portfolioValue = totalTokenValue
      const totalPortfolioInvested = totalInvested
      const totalProfitLoss = portfolioValue - totalPortfolioInvested
      const totalProfitLossPercent = totalPortfolioInvested > 0 ? (totalProfitLoss / totalPortfolioInvested) * 100 : 0

      setHoldings(holdingsArray)
      setTransactions(transactionsList)
      setWalletBalance({
        sui: suiBalance,
        tokens: totalTokenValue,
        total: suiBalance + totalTokenValue
      })
      setPortfolioStats({
        totalInvested: totalPortfolioInvested,
        currentValue: portfolioValue,
        profitLoss: totalProfitLoss,
        profitLossPercent: totalProfitLossPercent
      })
      setLastUpdated(new Date())

      console.log('💼 Holdings:', holdingsArray)
      console.log('📝 Transactions:', transactionsList.length)
      console.log('📊 Portfolio Stats:', {
        invested: totalPortfolioInvested,
        current: portfolioValue,
        profit: totalProfitLoss,
        percent: totalProfitLossPercent
      })
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [address, fetchSuiBalance])

  // Initial load
  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!address) return

    const interval = setInterval(() => {
      fetchPortfolio()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [address, fetchPortfolio])

  // Manual refresh
  const handleRefresh = () => {
    fetchPortfolio(true)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pt-32 md:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-20">
            <Wallet className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2 font-sentient">Connect Your Wallet</h2>
            <p className="text-white/60 font-mono">Connect your wallet to view your portfolio</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 md:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 font-mono">Loading portfolio...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-32 md:pt-40 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header with Refresh */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 font-sentient">
                My <span className="text-primary">Portfolio</span>
              </h1>
              <p className="text-xl text-white/70 font-mono">
                Track your holdings and transaction history
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="border-[#424242] text-white hover:bg-white/5 font-mono"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh'}
              </Button>
              {lastUpdated && (
                <span className="text-xs text-white/40 font-mono">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ENS Registration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className={`border ${isMapped ? 'border-blue-500/30 bg-blue-500/5' : 'border-primary/30 bg-primary/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className={`w-6 h-6 ${isMapped ? 'text-blue-400' : 'text-primary'}`} />
                    <h3 className="text-lg font-bold text-white font-mono">
                      {isMapped ? 'ENS Cross-Chain Setup' : 'Register ENS Name'}
                    </h3>
                  </div>
                  
                  {isMapped && currentMapping ? (
                    <>
                      <p className="text-sm text-white/70 mb-4 font-mono">
                        Your ENS is mapped to your Sui wallet for cross-chain transactions
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60 font-mono">Your Identity:</span>
                          <span className="font-mono font-semibold text-blue-400">{currentMapping.ensName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60 font-mono">Mapped Sui Address:</span>
                          <span className="font-mono text-xs text-white">{currentMapping.suiAddress.slice(0, 10)}...{currentMapping.suiAddress.slice(-8)}</span>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 p-3">
                        <p className="text-xs text-blue-300 font-mono">
                          ✅ Your ENS name is now your identity across the app - it will be displayed everywhere instead of wallet addresses!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/70 mb-4 font-mono">
                        Register an ENS name and map it to your Sui wallet for a unified cross-chain identity
                      </p>
                      <div className="flex gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center font-bold font-mono">1</div>
                          <span className="font-mono">Register ENS</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center font-bold font-mono">2</div>
                          <span className="font-mono">Map Wallets</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center font-bold font-mono">3</div>
                          <span className="font-mono">Done!</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsEnsModalOpen(true)}
                        className="bg-primary text-black hover:bg-primary/90 font-bold font-mono"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Portfolio Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Portfolio Value with P&L */}
          <Card className={`border-2 ${portfolioStats.profitLoss >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white/60 font-mono">Portfolio Value</h3>
                {portfolioStats.profitLossPercent !== 0 && (
                  <div className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                    portfolioStats.profitLoss >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {portfolioStats.profitLoss >= 0 ? '+' : ''}{portfolioStats.profitLossPercent.toFixed(2)}%
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-white font-mono mb-1">
                {portfolioStats.currentValue.toFixed(4)} SUI
              </div>
              {portfolioStats.profitLoss !== 0 && (
                <div className={`text-sm font-mono ${
                  portfolioStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioStats.profitLoss >= 0 ? '+' : ''}{portfolioStats.profitLoss.toFixed(4)} SUI
                </div>
              )}
              <div className="mt-3 text-xs text-white/60 font-mono">
                From {holdings.length} investment{holdings.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>

          {/* Total Invested */}
          <Card className="border border-[#424242] bg-[#121212]/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-bold text-white/60 font-mono">Total Invested</h3>
              </div>
              <div className="text-4xl font-bold text-white font-mono">
                {portfolioStats.totalInvested.toFixed(4)} SUI
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-white/60 font-mono">SUI Balance: </span>
                  <span className="text-white font-mono">{walletBalance.sui.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-white/60 font-mono">Total Value: </span>
                  <span className="text-white font-mono">{walletBalance.total.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Investment Pie Chart */}
        {holdings.length > 0 && (
          <InvestmentPieChart 
            holdings={holdings} 
            totalInvested={portfolioStats.totalInvested} 
          />
        )}

        {/* Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 font-sentient">Your Holdings</h2>

          {holdings.length === 0 ? (
            <Card className="border border-[#424242] bg-[#121212]/50">
              <CardContent className="pt-6 text-center py-12">
                <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 font-mono">No token holdings yet</p>
                <Link href="/tokens">
                  <Button className="mt-4 bg-primary text-black hover:bg-primary/90 font-mono">
                    Explore Tokens
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holdings.map((holding) => (
                <Link key={holding.tokenId} href={`/tokens/${holding.tokenId}`}>
                  <Card className="border border-[#424242] bg-[#121212]/50 hover:border-primary transition-all cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors font-mono">
                            {holding.tokenName}
                          </h3>
                          <p className="text-sm text-white/60 font-mono">${holding.tokenSymbol}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60 font-mono">Balance</span>
                          <span className="font-bold text-white font-mono">{formatNumber(holding.balance)} {holding.tokenSymbol}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60 font-mono">Current Price</span>
                          <div className="text-right">
                            <span className="font-bold text-white font-mono">{holding.currentPrice.toFixed(6)} SUI</span>
                            {holding.priceChange24h !== undefined && (
                              <div className={`text-xs font-mono ${
                                holding.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {holding.priceChange24h >= 0 ? '+' : ''}{holding.priceChange24h.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60 font-mono">Avg. Buy Price</span>
                          <span className="text-white font-mono">{holding.averagePrice.toFixed(6)} SUI</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60 font-mono">Invested</span>
                          <span className="text-white font-mono">{holding.totalInvested.toFixed(4)} SUI</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                          <span className="text-white/60 font-mono">Current Value</span>
                          <span className="font-bold text-primary font-mono">{holding.value.toFixed(4)} SUI</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60 font-mono">P&L</span>
                          <div className="text-right">
                            <span className={`font-bold font-mono ${
                              holding.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLoss.toFixed(4)} SUI
                            </span>
                            <div className={`text-xs font-mono ${
                              holding.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              ({holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4 font-sentient">Transaction History</h2>

          {transactions.length === 0 ? (
            <Card className="border border-[#424242] bg-[#121212]/50">
              <CardContent className="pt-6 text-center py-12">
                <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 font-mono">No transaction history yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-[#424242] bg-[#121212]/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div
                      key={tx.digest + index}
                      className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold font-mono">
                            BUY
                          </span>
                          <span className="font-bold text-white font-mono">
                            {formatNumber(tx.amount)} {tx.tokenSymbol}
                          </span>
                        </div>
                        <div className="text-sm text-white/60 flex items-center gap-2 font-mono">
                          <Clock className="w-3 h-3" />
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white font-mono">
                          {tx.totalCost.toFixed(6)} SUI
                        </div>
                        <div className="text-xs text-white/60 font-mono">
                          @ {tx.price.toFixed(8)} SUI
                        </div>
                      </div>

                      <a
                        href={`https://testnet.suivision.xyz/txblock/${tx.digest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4"
                      >
                        <Button variant="outline" size="sm" className="border border-white/20 text-white hover:bg-white/10">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* ENS Registration Modal */}
      <ENSRegistrationModal 
        isOpen={isEnsModalOpen} 
        onClose={() => setIsEnsModalOpen(false)} 
      />
    </div>
  )
}
