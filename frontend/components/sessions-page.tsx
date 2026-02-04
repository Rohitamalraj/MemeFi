"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Clock, Users, TrendingUp, Lock, Zap, Search, Filter, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Session {
  id: string
  tokenName: string
  tokenSymbol: string
  tokenImage?: string
  phase: "private" | "public"
  participantsCount: number
  maxParticipants: number
  volumeTraded: number
  timeRemaining: number // in seconds
  ensIdentity?: string
  currentPrice: number
  priceChange24h: number
}

// Mock data
const mockSessions: Session[] = [
  {
    id: "1",
    tokenName: "Pepe Moon",
    tokenSymbol: "PEPE",
    phase: "private",
    participantsCount: 47,
    maxParticipants: 100,
    volumeTraded: 12500,
    timeRemaining: 14400, // 4 hours
    ensIdentity: "anon42.session.memefi.eth",
    currentPrice: 0.00032,
    priceChange24h: 15.4,
  },
  {
    id: "2",
    tokenName: "Doge King",
    tokenSymbol: "DKING",
    phase: "private",
    participantsCount: 89,
    maxParticipants: 150,
    volumeTraded: 45600,
    timeRemaining: 7200, // 2 hours
    ensIdentity: "trader99.session.memefi.eth",
    currentPrice: 0.00018,
    priceChange24h: 23.7,
  },
  {
    id: "3",
    tokenName: "Shiba Rocket",
    tokenSymbol: "SROCKET",
    phase: "public",
    participantsCount: 234,
    maxParticipants: 200,
    volumeTraded: 98400,
    timeRemaining: 0,
    currentPrice: 0.00045,
    priceChange24h: -5.2,
  },
  {
    id: "4",
    tokenName: "Moon Cat",
    tokenSymbol: "MCAT",
    phase: "private",
    participantsCount: 12,
    maxParticipants: 50,
    volumeTraded: 3200,
    timeRemaining: 21600, // 6 hours
    ensIdentity: "fairbuyer.session.memefi.eth",
    currentPrice: 0.00012,
    priceChange24h: 8.9,
  },
]

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function SessionCard({ session }: { session: Session }) {
  const [timeLeft, setTimeLeft] = useState(session.timeRemaining)

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 hover:border-[#AFFF00] transition-all overflow-hidden group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-xl flex items-center justify-center font-black text-xl text-[#121212]">
                {session.tokenSymbol.slice(0, 2)}
              </div>
              <div>
                <CardTitle className="text-lg">{session.tokenName}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  ${session.tokenSymbol}
                </CardDescription>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                session.phase === "private"
                  ? "bg-[#AFFF00]/20 text-[#7AB800] border border-[#AFFF00]/50"
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}
            >
              {session.phase === "private" ? (
                <>
                  <Lock className="w-3 h-3" />
                  PRIVATE
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  PUBLIC
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ENS Identity (only for private) */}
          {session.phase === "private" && session.ensIdentity && (
            <div className="bg-[#AFFF00]/10 border border-[#AFFF00]/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#AFFF00] rounded-full animate-pulse" />
              <span className="text-xs font-mono text-[#121212]/80">
                Trading as: <span className="font-bold text-[#7AB800]">{session.ensIdentity}</span>
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Users className="w-3 h-3" />
                Participants
              </div>
              <div className="font-bold text-[#121212]">
                {session.participantsCount}/{session.maxParticipants}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Volume
              </div>
              <div className="font-bold text-[#121212]">{session.volumeTraded.toLocaleString()} SUI</div>
            </div>
          </div>

          {/* Price Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Current Price</div>
              <div className="text-lg font-bold text-[#121212]">{session.currentPrice.toFixed(6)} SUI</div>
            </div>
            <div
              className={`text-sm font-bold ${
                session.priceChange24h >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {session.priceChange24h >= 0 ? "+" : ""}
              {session.priceChange24h.toFixed(1)}%
            </div>
          </div>

          {/* Time Remaining */}
          {session.phase === "private" && timeLeft > 0 && (
            <div className="bg-[#121212] text-white rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#AFFF00]" />
                <span className="text-sm font-medium">Session ends in</span>
              </div>
              <span className="font-mono font-bold text-[#AFFF00]">{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* CTA */}
          <Link href={`/sessions/${session.id}`}>
            <Button className="w-full bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold rounded-full group">
              {session.phase === "private" ? "Join Session" : "View Details"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SessionsPage() {
  const [filter, setFilter] = useState<"all" | "private" | "public">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSessions = mockSessions.filter(session => {
    const matchesFilter = filter === "all" || session.phase === filter
    const matchesSearch =
      session.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
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
            Trading <span className="text-[#AFFF00]">Sessions</span>
          </h1>
          <p className="text-xl text-[#121212]/70 max-w-2xl mx-auto">
            Join privacy-protected trading sessions or explore public markets
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-3xl font-black text-[#AFFF00] mb-1">
                {mockSessions.filter(s => s.phase === "private").length}
              </div>
              <div className="text-sm text-[#121212]/60">Active Private Sessions</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-3xl font-black text-[#121212] mb-1">
                {mockSessions.reduce((acc, s) => acc + s.participantsCount, 0)}
              </div>
              <div className="text-sm text-[#121212]/60">Total Participants</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-3xl font-black text-[#AFFF00] mb-1">
                {mockSessions.reduce((acc, s) => acc + s.volumeTraded, 0).toLocaleString()}
              </div>
              <div className="text-sm text-[#121212]/60">SUI Volume 24h</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-3xl font-black text-[#121212] mb-1">
                {mockSessions.length}
              </div>
              <div className="text-sm text-[#121212]/60">Total Sessions</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#121212]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens..."
              className="w-full pl-12 pr-4 py-3 border-2 border-[#121212]/20 rounded-full focus:border-[#AFFF00] focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(["all", "private", "public"] as const).map((filterOption) => (
              <Button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                variant={filter === filterOption ? "default" : "outline"}
                className={`rounded-full font-bold capitalize ${
                  filter === filterOption
                    ? "bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90"
                    : "border-2 border-[#121212]"
                }`}
              >
                {filterOption === "private" && <Lock className="w-4 h-4 mr-2" />}
                {filterOption === "public" && <Eye className="w-4 h-4 mr-2" />}
                {filterOption === "all" && <Filter className="w-4 h-4 mr-2" />}
                {filterOption}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Sessions Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <SessionCard session={session} />
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-[#121212] mb-2">No sessions found</h3>
            <p className="text-[#121212]/60">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
