'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { PieChart } from 'lucide-react'

interface TokenHolding {
  tokenId: string
  tokenName: string
  tokenSymbol: string
  balance: number
  currentPrice: number
  value: number
  imageUrl?: string
  priceChange24h?: number
  totalInvested: number
  averagePrice: number
  profitLoss: number
  profitLossPercent: number
}

interface InvestmentPieChartProps {
  holdings: TokenHolding[]
  totalInvested: number
}

const COLORS = [
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
]

export function InvestmentPieChart({ holdings, totalInvested }: InvestmentPieChartProps) {
  if (!holdings.length || totalInvested === 0) return null

  // Calculate percentages and prepare data
  const chartData = holdings.map((holding, index) => ({
    ...holding,
    percentage: (holding.totalInvested / totalInvested) * 100,
    color: COLORS[index % COLORS.length]
  }))

  // Calculate angles for the donut chart
  let currentAngle = 0
  const segments = chartData.map(item => {
    const angle = (item.percentage / 100) * 360
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      angle: angle
    }
    currentAngle += angle
    return segment
  })

  // SVG dimensions
  const size = 160
  const strokeWidth = 30
  const radius = (size - strokeWidth) / 2
  const center = size / 2

  // Create path for each segment
  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle)
    const end = polarToCartesian(center, center, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ')
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8"
    >
      <Card className="border border-[#424242] bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-white font-mono">Total Investment</h3>
              </div>
              
              <div className="relative">
                <svg width={size} height={size} className="transform -rotate-90">
                  {segments.map((segment, index) => (
                    <motion.path
                      key={segment.tokenId}
                      d={createPath(segment.startAngle, segment.endAngle)}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 1000' }}
                      animate={{ strokeDasharray: '1000 0' }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  ))}
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white font-mono">{totalInvested.toFixed(2)}</span>
                  <span className="text-sm text-white/60 font-mono">Total SUI</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white/80 font-mono mb-4">Investment Breakdown</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {chartData.map((item, index) => (
                  <motion.div
                    key={item.tokenId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-bold text-white font-mono">{item.tokenName}</p>
                        <p className="text-xs text-white/60 font-mono">{item.tokenSymbol}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-bold text-white font-mono">{item.totalInvested.toFixed(2)} SUI</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 font-mono">{item.percentage.toFixed(1)}%</span>
                        <span className={`text-xs font-mono ${
                          item.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.profitLoss >= 0 ? '+' : ''}{item.profitLossPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}