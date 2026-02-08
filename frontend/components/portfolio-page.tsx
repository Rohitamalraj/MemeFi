"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, TrendingUp, Clock, ExternalLink, Activity, DollarSign, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWalletConnection } from "@/lib/use-wallet"
import { getSuiClient, getTokenById } from "@/lib/sui-client"
import { MEMEFI_CONFIG } from "@/lib/contract-config"
import { useWalletMapping } from "@/hooks/use-wallet-mapping"
import { ENSRegistrationModal } from "@/components/ens-registration-modal"

interface TokenHolding {
  tokenId: string
  tokenName: string
  tokenSymbol: string
  balance: number
  currentPrice: number
  value: number
  imageUrl?: string
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
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [isEnsModalOpen, setIsEnsModalOpen] = useState(false)
  const { currentMapping, isMapped } = useWalletMapping()

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    async function fetchPortfolio() {
      try {
        const client = getSuiClient()

        // Fetch all PurchaseMade events for this user
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${MEMEFI_CONFIG.packageId}::token_v2::PurchaseMade`
          },
          order: 'descending',
        })

        console.log('📊 Fetched events:', events.data.length)

        // Group by token to calculate holdings
        const holdingsMap = new Map<string, { balance: number; txs: any[] }>()
        const transactionsList: Transaction[] = []

        for (const event of events.data) {
          const parsedJson = event.parsedJson as any
          const buyer = parsedJson.buyer
          const tokenId = parsedJson.token_id
          const amount = Number(parsedJson.amount)

          // Only include transactions for this user
          if (buyer === address) {
            if (!holdingsMap.has(tokenId)) {
              holdingsMap.set(tokenId, { balance: 0, txs: [] })
            }

            const holding = holdingsMap.get(tokenId)!
            holding.balance += amount
            holding.txs.push({
              digest: event.id.txDigest,
              timestamp: Number(event.timestampMs),
              amount,
            })
          }
        }

        // Fetch token details for each token
        const holdingsArray: TokenHolding[] = []
        for (const [tokenId, data] of holdingsMap.entries()) {
          try {
            const token = await getTokenById(tokenId)
            if (token && data.balance > 0) {
              holdingsArray.push({
                tokenId,
                tokenName: token.name,
                tokenSymbol: token.symbol,
                balance: data.balance,
                currentPrice: token.currentPrice,
                value: data.balance * token.currentPrice,
                imageUrl: token.imageUrl,
              })

              // Add transactions for this token
              for (const tx of data.txs) {
                transactionsList.push({
                  digest: tx.digest,
                  timestamp: tx.timestamp,
                  tokenName: token.name,
                  tokenSymbol: token.symbol,
                  amount: tx.amount,
                  price: token.currentPrice,
                  totalCost: tx.amount * token.currentPrice,
                  type: 'buy'
                })
              }
            }
          } catch (error) {
            console.error(`Error fetching token ${tokenId}:`, error)
          }
        }

        setHoldings(holdingsArray)
        setTransactions(transactionsList)

        const total = holdingsArray.reduce((sum, h) => sum + h.value, 0)
        setTotalValue(total)

        console.log('💼 Holdings:', holdingsArray)
        console.log('📝 Transactions:', transactionsList.length)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [address])

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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-sentient">
            My <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-xl text-white/70 font-mono">
            Track your holdings and transaction history
          </p>
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

        {/* Total Value Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-bold text-white/60 font-mono">Total Portfolio Value</h3>
              </div>
              <div className="text-4xl font-bold text-white font-mono">
                {totalValue.toFixed(4)} SUI
              </div>
              <div className="mt-2 text-sm text-white/60 font-mono">
                Across {holdings.length} token{holdings.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                          <span className="text-white/60 font-mono">Price</span>
                          <span className="font-bold text-white font-mono">{holding.currentPrice.toFixed(6)} SUI</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                          <span className="text-white/60 font-mono">Value</span>
                          <span className="font-bold text-primary font-mono">{holding.value.toFixed(4)} SUI</span>
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
