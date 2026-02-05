"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Shield, TrendingUp, Search, Filter, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePrivatePhaseTokens } from "@/lib/use-contracts"
import { type MemeTokenData } from "@/lib/sui-client"

// Helper to format timestamp to relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  let timestampMs = timestamp
  if (timestamp < 946684800000) {
    timestampMs = timestamp * 1000
  }
  
  const diff = now - timestampMs
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "just now"
}

// Helper to format time remaining
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Ended"
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) return `${hours}h ${minutes}m left`
  if (minutes > 0) return `${minutes}m left`
  return `${seconds}s left`
}

function SessionCard({ token }: { token: MemeTokenData }) {
  const now = Date.now()
  const phaseEndTime = token.launchTime + (token.phaseDurationMs * 2) // End of PRIVATE phase
  const timeRemaining = Math.max(0, Math.floor((phaseEndTime - now) / 1000))
  
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/tokens/${token.id}`}>
        <Card className="border-2 hover:border-[#AFFF00] transition-all cursor-pointer group">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-xl flex items-center justify-center font-black text-2xl text-[#121212]">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-[#121212] group-hover:text-[#AFFF00] transition-colors mb-1">
                    {token.name}
                  </h3>
                  <p className="text-sm text-[#121212]/60 font-mono mb-1">${token.symbol}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-[#AFFF00]">
                      <div className="w-2 h-2 bg-[#AFFF00] rounded-full animate-pulse" />
                      Private Phase
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#121212]/60 mb-1">Time Remaining</div>
                <div className="font-bold text-[#AFFF00] flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTimeRemaining(timeRemaining)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-[#121212]/60 mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Max Buy
                </div>
                <div className="font-bold text-sm">
                  {(token.maxBuyPerWallet / 1_000_000_000).toFixed(0)}K
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-[#121212]/60 mb-1">Total Supply</div>
                <div className="font-bold text-sm">
                  {(token.totalSupply / 1_000_000_000).toFixed(0)}M
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-[#121212]/60 mb-1">Circulating</div>
                <div className="font-bold text-sm">
                  {(token.circulatingSupply / 1_000_000_000).toFixed(0)}M
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-[#121212]/50">
                Launched {formatRelativeTime(token.launchTime)}
              </div>
              <Button
                size="sm"
                className="bg-[#AFFF00] hover:bg-[#7AB800] text-[#121212] font-bold"
              >
                Trade Now →
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function SessionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch tokens in PRIVATE phase
  const { tokens, isLoading, error, refetch } = usePrivatePhaseTokens()

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black mb-4">
            <span className="text-[#121212]">Private Trading </span>
            <span className="text-[#AFFF00]">Sessions</span>
          </h1>
          <p className="text-xl text-[#121212]/60 max-w-2xl mx-auto">
            Trade tokens during their private phase - accumulate before public launch
          </p>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#AFFF00]/10 border-2 border-[#AFFF00]/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-[#7AB800] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-[#121212] mb-2">
                What is Private Phase Trading?
              </h3>
              <div className="text-[#121212]/70 space-y-1 text-sm">
                <p>• <strong>Early Phase Duration</strong> - How long Phase 0 (LAUNCH) lasts before PRIVATE phase begins</p>
                <p>• <strong>Private Session Duration</strong> - How long Phase 1 (PRIVATE) lasts - tokens appear here during this time</p>
                <p>• <strong>Automatic Display</strong> - Tokens automatically appear when they enter PRIVATE phase</p>
                <p>• <strong>Time Limited</strong> - Trade before the phase ends and token goes public</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#121212]/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by token name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#AFFF00] focus:outline-none bg-white text-[#121212] placeholder:text-[#121212]/40"
            />
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 className="w-12 h-12 animate-spin text-[#AFFF00] mx-auto mb-4" />
            <p className="text-[#121212]/60">Loading private phase tokens...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-[#121212] mb-4">{error}</p>
            <Button
              onClick={refetch}
              className="bg-[#AFFF00] hover:bg-[#7AB800] text-[#121212] font-bold"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Tokens Grid */}
        {!isLoading && !error && (
          <>
            {filteredTokens.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid md:grid-cols-2 lg:grid-cols-2 gap-6"
              >
                {filteredTokens.map((token, index) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <SessionCard token={token} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Shield className="w-16 h-16 text-[#121212]/20 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#121212] mb-3">
                  No Active Private Sessions
                </h3>
                <p className="text-[#121212]/60 max-w-md mx-auto mb-6">
                  {searchQuery
                    ? "No tokens match your search. Try different keywords."
                    : "No tokens are currently in PRIVATE phase. Launch a new token or wait for existing tokens to enter their private phase."}
                </p>
                <Link href="/launch">
                  <Button className="bg-[#AFFF00] hover:bg-[#7AB800] text-[#121212] font-bold">
                    Launch New Token
                  </Button>
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
