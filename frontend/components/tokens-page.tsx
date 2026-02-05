"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, TrendingUp, TrendingDown, Clock, Shield, Eye, ArrowRight, Filter, Loader2, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTokens, useTradingSession } from "@/lib/use-contracts"
import { MemeTokenData } from "@/lib/sui-client"
import { TOKEN_PHASES, PHASE_LABELS } from "@/lib/contract-config"

interface Token {
  id: string
  name: string
  symbol: string
  image?: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  holders: number
  phase: "early" | "public" | "open"
  phaseNumber: number // Actual phase from blockchain
  hasActiveSessions: boolean
  launchedAt: string
  totalSupply: number
  circulatingSupply: number
}

// Helper to convert blockchain phase number to readable phase
function getPhaseLabel(phaseNumber: number): "early" | "public" | "open" {
  if (phaseNumber === 0) return "early"   // PHASE_LAUNCH
  if (phaseNumber === 1) return "early"   // PHASE_PRIVATE (still early)
  if (phaseNumber === 2) return "public"  // PHASE_SETTLEMENT
  return "open" // PHASE_OPEN
}

// Helper to format timestamp to relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  
  // Sui timestamps are in milliseconds, but verify
  // If timestamp is suspiciously small (< year 2000 in ms), it might be in seconds
  let timestampMs = timestamp
  if (timestamp < 946684800000) { // Jan 1, 2000 in milliseconds
    timestampMs = timestamp * 1000 // Convert seconds to milliseconds
  }
  
  const diff = now - timestampMs
  
  console.log('⏰ Timestamp debug:', { 
    raw: timestamp, 
    converted: timestampMs, 
    now, 
    diff, 
    diffMinutes: Math.floor(diff / 60000) 
  })
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  
  if (weeks > 0) return `${weeks}w ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  if (seconds > 0) return `${seconds}s ago`
  return "just now"
}

// Convert blockchain token data to display format
function convertToDisplayToken(tokenData: MemeTokenData): Token {
  const phase = getPhaseLabel(tokenData.currentPhase)
  const supplyPercent = tokenData.totalSupply > 0 
    ? (tokenData.circulatingSupply / tokenData.totalSupply) * 100 
    : 0
  
  return {
    id: tokenData.id,
    name: tokenData.name,
    symbol: tokenData.symbol,
    // Placeholder values - will be calculated from actual trading data later
    price: 0.00001, // Base price
    priceChange24h: 0,
    volume24h: 0,
    marketCap: tokenData.totalSupply * 0.00001, // totalSupply * base price
    holders: 0, // Will need to query from balances
    phase,
    phaseNumber: tokenData.currentPhase, // Keep actual phase number
    hasActiveSessions: false, // Will need to query active sessions
    launchedAt: formatRelativeTime(tokenData.launchTime),
    totalSupply: tokenData.totalSupply,
    circulatingSupply: tokenData.circulatingSupply,
  }
}

function TokenCard({ token }: { token: Token }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/tokens/${token.id}`}>
        <Card className="border-2 hover:border-[#AFFF00] transition-all cursor-pointer group">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-xl flex items-center justify-center font-black text-xl text-[#121212]">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#121212] group-hover:text-[#AFFF00] transition-colors">
                    {token.name}
                  </h3>
                  <p className="text-sm text-[#121212]/60 font-mono">${token.symbol}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      token.phase === "early"
                        ? "bg-[#AFFF00]/20 text-[#7AB800] border border-[#AFFF00]/50"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {token.phase === "early" ? "EARLY" : "PUBLIC"}
                  </div>
                  <div className="text-xs text-[#121212]/40 font-mono">
                    Phase {token.phaseNumber}
                  </div>
                </div>
                {token.hasActiveSessions && (
                  <div className="flex items-center gap-1 text-xs text-[#AFFF00]">
                    <div className="w-2 h-2 bg-[#AFFF00] rounded-full animate-pulse" />
                    Live Session
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-[#121212]/60 mb-1">Price</div>
                <div className="font-bold text-[#121212]">{token.price.toFixed(6)} SUI</div>
              </div>
              <div>
                <div className="text-xs text-[#121212]/60 mb-1">24h Change</div>
                <div
                  className={`font-bold flex items-center gap-1 ${
                    token.priceChange24h >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {token.priceChange24h >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-[#121212]/60 mb-1">Volume</div>
                <div className="font-bold">{(token.volume24h / 1000).toFixed(0)}K</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-[#121212]/60 mb-1">MCap</div>
                <div className="font-bold">{(token.marketCap / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-[#121212]/60 mb-1">Holders</div>
                <div className="font-bold">{token.holders}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#121212]/50">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {token.launchedAt}
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#AFFF00]" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function TokensPage() {
  const [sortBy, setSortBy] = useState<"trending" | "new" | "volume">("new")
  const [filterPhase, setFilterPhase] = useState<"all" | "early" | "public" | "open">("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch tokens from blockchain
  const { tokens: blockchainTokens, isLoading, error, refetch } = useTokens()
  
  // Convert blockchain tokens to display format
  const displayTokens = blockchainTokens.map(convertToDisplayToken)

  const filteredTokens = displayTokens
    .filter(token => {
      const matchesPhase = filterPhase === "all" || token.phase === filterPhase
      const matchesSearch =
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesPhase && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "trending") return b.priceChange24h - a.priceChange24h
      if (sortBy === "volume") return b.volume24h - a.volume24h
      // For "new", sort by launch time (most recent first)
      return 0 // Already in descending order from events query
    })

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-black text-[#121212] mb-4">
            Explore <span className="text-[#AFFF00]">Tokens</span>
          </h1>
          <p className="text-xl text-[#121212]/70 max-w-2xl mx-auto">
            Discover fair-launched memecoins on Sui
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#121212]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens by name or symbol..."
              className="w-full pl-12 pr-4 py-4 border-2 border-[#121212]/20 rounded-full focus:border-[#AFFF00] focus:outline-none transition-colors text-lg"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <span className="text-sm font-bold text-[#121212]/60 flex items-center">Sort:</span>
              {(["trending", "new", "volume"] as const).map((sort) => (
                <Button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  variant={sortBy === sort ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full font-bold capitalize ${
                    sortBy === sort
                      ? "bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90"
                      : "border-2 border-[#121212]/20"
                  }`}
                >
                  {sort}
                </Button>
              ))}
            </div>
            <div className="h-6 w-px bg-[#121212]/20" />
            <div className="flex gap-2">
              <span className="text-sm font-bold text-[#121212]/60 flex items-center">Phase:</span>
              {(["all", "early", "public", "open"] as const).map((phase) => (
                <Button
                  key={phase}
                  onClick={() => setFilterPhase(phase)}
                  variant={filterPhase === phase ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full font-bold capitalize ${
                    filterPhase === phase
                      ? "bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90"
                      : "border-2 border-[#121212]/20"
                  }`}
                >
                  {phase === "early" && <Shield className="w-3 h-3 mr-1" />}
                  {phase === "public" && <Eye className="w-3 h-3 mr-1" />}
                  {phase}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-[#AFFF00] animate-spin mb-4" />
            <p className="text-[#121212]/60 text-lg">Loading tokens from blockchain...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-[#121212] mb-2">Failed to load tokens</h3>
            <p className="text-[#121212]/60 mb-6">{error}</p>
            <Button 
              onClick={refetch}
              className="bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold rounded-full px-8"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Tokens Grid */}
        {!isLoading && !error && filteredTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTokens.map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <TokenCard 
                  key={token.id}
                  token={token}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTokens.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-[#121212] mb-2">
              {displayTokens.length === 0 ? "No tokens launched yet" : "No tokens found"}
            </h3>
            <p className="text-[#121212]/60 mb-6">
              {displayTokens.length === 0 
                ? "Be the first to launch a token on MemeFi!" 
                : "Try adjusting your search or filters"}
            </p>
            <Link href="/launch">
              <Button className="bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold rounded-full px-8">
                Launch Your Token
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
