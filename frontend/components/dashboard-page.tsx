"use client"

import { motion } from "framer-motion"
import { Rocket, TrendingUp, Users, Activity, Clock, Shield, Eye, ArrowRight, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DashboardPage() {
  const userStats = {
    tokensLaunched: 2,
    sessionsJoined: 5,
    totalVolume: 15420,
    totalHoldings: 8.4,
  }

  const myLaunches = [
    {
      id: "1",
      name: "Pepe Moon",
      symbol: "PEPE",
      holders: 1247,
      volume24h: 125000,
      phase: "early",
      launchedAt: "2h ago",
    },
  ]

  const myParticipations = [
    {
      id: "2",
      tokenName: "Doge King",
      tokenSymbol: "DKING",
      sessionPhase: "private",
      ensIdentity: "trader99.session.memefi.eth",
      balance: 5000,
      value: 0.9,
    },
    {
      id: "3",
      tokenName: "Moon Cat",
      tokenSymbol: "MCAT",
      sessionPhase: "private",
      ensIdentity: "fairbuyer.session.memefi.eth",
      balance: 12000,
      value: 1.44,
    },
  ]

  const recentActivity = [
    { action: "Joined session", token: "DKING", time: "30m ago", type: "join" },
    { action: "Launched token", token: "PEPE", time: "2h ago", type: "launch" },
    { action: "Session settled", token: "SROCKET", time: "5h ago", type: "settle" },
  ]

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-[#121212] mb-2">
                Your <span className="text-[#AFFF00]">Dashboard</span>
              </h1>
              <p className="text-xl text-[#121212]/70">
                Track your launches, sessions, and portfolio
              </p>
            </div>
            <Link href="/launch">
              <Button className="bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold rounded-full px-6">
                <Plus className="w-5 h-5 mr-2" />
                New Launch
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-2 hover:border-[#AFFF00] transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#AFFF00]/20 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-[#AFFF00]" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#121212] mb-1">
                {userStats.tokensLaunched}
              </div>
              <div className="text-sm text-[#121212]/60">Tokens Launched</div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#AFFF00] transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#AFFF00]/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#AFFF00]" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#121212] mb-1">
                {userStats.sessionsJoined}
              </div>
              <div className="text-sm text-[#121212]/60">Sessions Joined</div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#AFFF00] transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#AFFF00]/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#AFFF00]" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#121212] mb-1">
                {userStats.totalVolume.toLocaleString()}
              </div>
              <div className="text-sm text-[#121212]/60">Total Volume (SUI)</div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#AFFF00] transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#AFFF00]/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#AFFF00]" />
                </div>
              </div>
              <div className="text-3xl font-black text-[#AFFF00] mb-1">
                {userStats.totalHoldings.toFixed(1)}
              </div>
              <div className="text-sm text-[#121212]/60">SUI Holdings</div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Launches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-[#121212]">My Launches</h2>
                <Link href="/tokens">
                  <Button variant="ghost" size="sm" className="text-[#AFFF00] hover:text-[#AFFF00]/80">
                    View All →
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {myLaunches.map((launch) => (
                  <Card key={launch.id} className="border-2 hover:border-[#AFFF00] transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-xl flex items-center justify-center font-black text-xl text-[#121212]">
                            {launch.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-[#121212]">{launch.name}</h3>
                            <p className="text-sm text-[#121212]/60 font-mono">${launch.symbol}</p>
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            launch.phase === "early"
                              ? "bg-[#AFFF00]/20 text-[#7AB800] border border-[#AFFF00]/50"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {launch.phase.toUpperCase()}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <div className="text-xs text-[#121212]/60 mb-1">Holders</div>
                          <div className="font-bold text-[#121212]">{launch.holders}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#121212]/60 mb-1">Volume 24h</div>
                          <div className="font-bold text-[#121212]">
                            {(launch.volume24h / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#121212]/60 mb-1">Launched</div>
                          <div className="font-bold text-[#121212]">{launch.launchedAt}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Active Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-[#121212]">Active Sessions</h2>
                <Link href="/sessions">
                  <Button variant="ghost" size="sm" className="text-[#AFFF00] hover:text-[#AFFF00]/80">
                    View All →
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {myParticipations.map((participation) => (
                  <Card key={participation.id} className="border-2 hover:border-[#AFFF00] transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#AFFF00] to-[#7AB800] rounded-xl flex items-center justify-center font-black text-xl text-[#121212]">
                            {participation.tokenSymbol.slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-[#121212]">{participation.tokenName}</h3>
                            <p className="text-sm text-[#121212]/60 font-mono">
                              ${participation.tokenSymbol}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-[#AFFF00]/20 text-[#7AB800] border border-[#AFFF00]/50 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          PRIVATE
                        </div>
                      </div>
                      <div className="bg-[#AFFF00]/10 border border-[#AFFF00]/30 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#AFFF00] rounded-full animate-pulse" />
                        <span className="text-xs font-mono text-[#121212]/80">
                          Trading as: <span className="font-bold text-[#7AB800]">{participation.ensIdentity}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[#121212]/60 mb-1">Balance</div>
                          <div className="font-bold text-[#121212]">
                            {participation.balance.toLocaleString()} tokens
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#121212]/60 mb-1">Value</div>
                          <div className="font-bold text-[#AFFF00]">{participation.value.toFixed(2)} SUI</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#AFFF00]" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "launch"
                            ? "bg-[#AFFF00]/20"
                            : activity.type === "join"
                              ? "bg-blue-100"
                              : "bg-purple-100"
                        }`}
                      >
                        {activity.type === "launch" && <Rocket className="w-4 h-4 text-[#AFFF00]" />}
                        {activity.type === "join" && <Users className="w-4 h-4 text-blue-600" />}
                        {activity.type === "settle" && <Shield className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#121212]">{activity.action}</p>
                        <p className="text-xs text-[#121212]/60 font-mono">{activity.token}</p>
                        <p className="text-xs text-[#121212]/40 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-2 border-[#AFFF00]/30 bg-[#AFFF00]/5">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/launch">
                    <Button className="w-full bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold rounded-full">
                      <Rocket className="w-4 h-4 mr-2" />
                      Launch New Token
                    </Button>
                  </Link>
                  <Link href="/sessions">
                    <Button variant="outline" className="w-full border-2 border-[#121212] rounded-full font-bold">
                      <Eye className="w-4 h-4 mr-2" />
                      Browse Sessions
                    </Button>
                  </Link>
                  <Link href="/tokens">
                    <Button variant="outline" className="w-full border-2 border-[#121212] rounded-full font-bold">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Explore Tokens
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
