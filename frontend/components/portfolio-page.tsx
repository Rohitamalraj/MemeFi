"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, TrendingUp, Clock, ExternalLink, Activity, DollarSign, Globe, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWalletConnection } from "@/lib/use-wallet"
import { getSuiClient, getTokenById } from "@/lib/sui-client"
import { MEMEFI_CONFIG } from "@/lib/contract-config"
import { ENSRegistrationModal } from "@/components/ens-registration-modal"
import { useWalletMapping } from "@/hooks/use-wallet-mapping"

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

  // Check if currently connected wallet matches the mapping
  const isCorrectWallet = currentMapping && address 
    ? currentMapping.suiAddress.toLowerCase() === address.toLowerCase()
    : true // If no mapping or no address, no validation needed

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
      <div className="min-h-screen bg-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-20">
            <Wallet className="w-16 h-16 text-[#121212]/20 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#121212] mb-2">Connect Your Wallet</h2>
            <p className="text-[#121212]/60">Connect your wallet to view your portfolio</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-[#AFFF00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#121212]/60">Loading portfolio...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-black text-[#121212] mb-4">
            My Portfolio
          </h1>
          <p className="text-xl text-[#121212]/70">
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
          <Card className={`border-2 ${isMapped && isCorrectWallet ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-white' : 'border-[#AFFF00] bg-gradient-to-br from-[#AFFF00]/10 to-white'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className={`w-6 h-6 ${isMapped && isCorrectWallet ? 'text-green-600' : 'text-[#7AB800]'}`} />
                    <h3 className="text-lg font-bold text-[#121212]">
                      {isMapped && isCorrectWallet ? 'ENS Cross-Chain Setup' : 'Register ENS Name'}
                    </h3>
                  </div>
                  
                  {isMapped && isCorrectWallet && currentMapping ? (
                    <div className="space-y-2">
                      {/* Wallet Mismatch Warning */}
                      {!isCorrectWallet && (
                        <div className="mb-3 p-3 bg-red-50 border-2 border-red-500 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-red-700 mb-1">⚠️ Wrong Wallet Connected</p>
                              <p className="text-xs text-red-600 mb-2">
                                You're connected with a different wallet than the one mapped to <strong>{currentMapping.ensName}</strong>
                              </p>
                              <div className="space-y-1 text-xs">
                                <p className="text-red-600">
                                  <strong>Mapped Sui Wallet:</strong> <span className="font-mono">{currentMapping.suiAddress.slice(0, 10)}...{currentMapping.suiAddress.slice(-8)}</span>
                                </p>
                                <p className="text-red-600">
                                  <strong>Connected Sui Wallet:</strong> <span className="font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                                </p>
                              </div>
                              <p className="text-xs text-red-600 mt-2 font-semibold">
                                Please reconnect with the correct wallet to use {currentMapping.ensName}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-[#121212]/70 mb-3">
                        Your ENS is mapped to your Sui wallet for cross-chain transactions
                      </p>
                      <div className="bg-white/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#121212]/60">Your Identity:</span>
                          <span className={`font-mono font-bold text-base ${isCorrectWallet ? 'text-green-600' : 'text-gray-400'}`}>
                            {currentMapping.ensName} {isCorrectWallet ? '✓' : '⚠'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#121212]/60">Mapped ETH Address:</span>
                          <span className="font-mono text-xs">{currentMapping.ethAddress.slice(0, 6)}...{currentMapping.ethAddress.slice(-4)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#121212]/60">Mapped Sui Address:</span>
                          <span className={`font-mono text-xs ${isCorrectWallet ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                            {currentMapping.suiAddress.slice(0, 6)}...{currentMapping.suiAddress.slice(-4)}
                            {isCorrectWallet && ' ✓'}
                          </span>
                        </div>
                        {address && (
                          <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <span className="text-[#121212]/60">Currently Connected:</span>
                            <span className={`font-mono text-xs ${isCorrectWallet ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                              {address.slice(0, 6)}...{address.slice(-4)}
                              {isCorrectWallet ? ' ✓' : ' ✗'}
                            </span>
                          </div>
                        )}
                      </div>
                      {isCorrectWallet ? (
                        <p className="text-xs text-green-600 mt-2 font-semibold">
                          ✅ <strong>{currentMapping.ensName}</strong> is active and will be displayed everywhere instead of wallet addresses!
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          ⚠️ Connect the correct wallet to use <strong>{currentMapping.ensName}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-[#121212]/70">
                        Register an ENS name and map it to your Sui wallet for seamless cross-chain transactions
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Register ENS</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Map to ETH</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Map to Sui</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => setIsEnsModalOpen(true)}
                  className="ml-4 bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 whitespace-nowrap"
                  size="lg"
                >
                  {isMapped ? 'View Setup' : 'Get Started'}
                </Button>
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
          <Card className="border-2 border-[#AFFF00] bg-gradient-to-br from-[#AFFF00]/10 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-[#7AB800]" />
                <h3 className="text-sm font-bold text-[#121212]/60">Total Portfolio Value</h3>
              </div>
              <div className="text-4xl font-black text-[#121212]">
                {totalValue.toFixed(4)} SUI
              </div>
              <div className="mt-2 text-sm text-[#121212]/60">
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
          <h2 className="text-2xl font-black text-[#121212] mb-4">Your Holdings</h2>

          {holdings.length === 0 ? (
            <Card className="border-2">
              <CardContent className="pt-6 text-center py-12">
                <Activity className="w-12 h-12 text-[#121212]/20 mx-auto mb-3" />
                <p className="text-[#121212]/60">No token holdings yet</p>
                <Link href="/tokens">
                  <Button className="mt-4 bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90">
                    Explore Tokens
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holdings.map((holding) => (
                <Link key={holding.tokenId} href={`/tokens/${holding.tokenId}`}>
                  <Card className="border-2 hover:border-[#AFFF00] transition-all cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-[#121212] group-hover:text-[#AFFF00] transition-colors">
                            {holding.tokenName}
                          </h3>
                          <p className="text-sm text-[#121212]/60 font-mono">${holding.tokenSymbol}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#121212]/60">Balance</span>
                          <span className="font-bold">{formatNumber(holding.balance)} {holding.tokenSymbol}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#121212]/60">Price</span>
                          <span className="font-bold">{holding.currentPrice.toFixed(6)} SUI</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-[#121212]/60">Value</span>
                          <span className="font-bold text-[#AFFF00]">{holding.value.toFixed(4)} SUI</span>
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
          <h2 className="text-2xl font-black text-[#121212] mb-4">Transaction History</h2>

          {transactions.length === 0 ? (
            <Card className="border-2">
              <CardContent className="pt-6 text-center py-12">
                <Clock className="w-12 h-12 text-[#121212]/20 mx-auto mb-3" />
                <p className="text-[#121212]/60">No transaction history yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div
                      key={tx.digest + index}
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                            BUY
                          </span>
                          <span className="font-bold text-[#121212]">
                            {formatNumber(tx.amount)} {tx.tokenSymbol}
                          </span>
                        </div>
                        <div className="text-sm text-[#121212]/60 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-[#121212]">
                          {tx.totalCost.toFixed(6)} SUI
                        </div>
                        <div className="text-xs text-[#121212]/60">
                          @ {tx.price.toFixed(8)} SUI
                        </div>
                      </div>

                      <a
                        href={`https://testnet.suivision.xyz/txblock/${tx.digest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4"
                      >
                        <Button variant="outline" size="sm" className="border-2">
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
