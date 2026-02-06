'use client'

import { useEffect, useRef, useLayoutEffect, useState } from 'react'
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  Time,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts'
import { useChartData } from '@/lib/use-chart-data'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Lock, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatUSD } from '@/lib/price-feed'

interface TradingChartProps {
  tokenId: string
  tokenSymbol: string
  currentPhase: number
  isPrivatePhase: boolean
  intervalMinutes?: number
  marketCap?: number
  marketCapUsd?: number
  marketCapChange24h?: number
  marketCapChangePercent24h?: number
  totalVolume?: number
  currentPrice?: number
  currentPriceUsd?: number
  suiUsdPrice?: number
}

type Timeframe = '1m' | '5m' | '15m' | '1H' | '1D'
type DisplayMode = 'price' | 'mcap'
type PriceMode = 'usd' | 'sui'

export function TradingChart({
  tokenId,
  tokenSymbol,
  currentPhase,
  isPrivatePhase,
  intervalMinutes = 1,
  marketCap = 0,
  marketCapUsd = 0,
  marketCapChange24h = 0,
  marketCapChangePercent24h = 0,
  totalVolume = 0,
  currentPrice = 0,
  currentPriceUsd = 0,
  suiUsdPrice = 1.5,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)

  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('price')
  const [priceMode, setPriceMode] = useState<PriceMode>('usd')
  const [showBubbles, setShowBubbles] = useState(true)

  const { candles, volumeData, loading, error, isEmpty } = useChartData(
    tokenId,
    intervalMinutes,
    !isPrivatePhase
  )

  // Initialize chart - useLayoutEffect runs synchronously after DOM updates
  useLayoutEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f0f' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e1e1e', style: 0, visible: true },
        horzLines: { color: '#1e1e1e', style: 0, visible: true },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2b2b2b',
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#2b2b2b',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 2,
          labelBackgroundColor: '#363c4e',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 2,
          labelBackgroundColor: '#363c4e',
        },
      },
    })

    chartRef.current = chart

    // Add candlestick series with pump.fun style colors
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    candleSeriesRef.current = candleSeries

    // Add volume series with better visibility  
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })

    volumeSeriesRef.current = volumeSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      chartRef.current = null
    }
  }, [])

  // Update chart data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return
    }

    try {
      // Convert candles to lightweight-charts format
      const chartCandles = candles.map(c => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))

      // Convert volume data to lightweight-charts format
      const chartVolume = volumeData.map(v => ({
        time: v.time as Time,
        value: v.value,
        color: v.color,
      }))

      candleSeriesRef.current.setData(chartCandles)
      volumeSeriesRef.current.setData(chartVolume)

      // Fit content to show all data
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (error) {
      console.error('📊 Error updating chart data:', error)
    }
  }, [candles, volumeData])

  return (
    <Card className="border-2 border-gray-800 bg-[#0f0f0f]">
      <CardContent className="p-0">
        {/* Pump.fun Style Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Market Cap</div>
              <div className="text-3xl font-black text-white mb-2">
                {priceMode === 'usd' && marketCapUsd > 0 
                  ? formatUSD(marketCapUsd) 
                  : `${marketCap.toFixed(2)} SUI`}
              </div>
              {marketCapChange24h !== undefined && marketCapChangePercent24h !== undefined && (
                <div className={`text-sm font-bold flex items-center gap-1 ${
                  marketCapChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {marketCapChange24h >= 0 ? '+' : ''}{priceMode === 'usd' ? formatUSD(marketCapChange24h) : `${marketCapChange24h.toFixed(4)} SUI`}
                  {' '}({marketCapChange24h >= 0 ? '+' : ''}{marketCapChangePercent24h.toFixed(2)}%) 24hr
                </div>
              )}
            </div>
            
            <div className="text-right text-sm">
              <div className="text-gray-400 mb-1">ATH</div>
              <div className="font-bold text-white">
                {priceMode === 'usd' && marketCapUsd > 0
                  ? formatUSD(marketCapUsd * 1.5)
                  : `${(marketCap * 1.5).toFixed(4)} SUI`}
              </div>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
              {(['1m', '5m', '15m', '1H', '1D'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                    timeframe === tf
                      ? 'bg-[#AFFF00] text-[#121212]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Trade Display Toggle */}
            <button
              onClick={() => setShowBubbles(!showBubbles)}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                showBubbles
                  ? 'bg-[#AFFF00]/20 text-[#AFFF00]'
                  : 'bg-[#1a1a1a] text-gray-400'
              }`}
            >
              <Eye className="w-3 h-3" />
              Trade Display
            </button>

            {/* Hide All Bubbles */}
            <button
              className="px-3 py-1 text-xs font-bold rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
            >
              Hide All Bubbles
            </button>

            {/* Price/MCap Toggle */}
            <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('price')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  displayMode === 'price'
                    ? 'bg-[#AFFF00] text-[#121212]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Price
              </button>
              <button
                onClick={() => setDisplayMode('mcap')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  displayMode === 'mcap'
                    ? 'bg-[#AFFF00] text-[#121212]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MCap
              </button>
            </div>

            {/* USD/SUI Toggle */}
            <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
              <button
                onClick={() => setPriceMode('usd')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  priceMode === 'usd'
                    ? 'bg-[#AFFF00] text-[#121212]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setPriceMode('sui')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  priceMode === 'sui'
                    ? 'bg-[#AFFF00] text-[#121212]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                SUI
              </button>
            </div>
          </div>

          {/* Token Info Bar */}
          <div className="text-xs text-gray-400 mb-4 flex items-center gap-4">
            <div>
              <span className="text-gray-500">{tokenSymbol}/{priceMode === 'usd' ? 'USD' : 'SUI'} Market Cap ({priceMode === 'usd' ? 'USD' : 'SUI'})</span> • 1 • 
              <span className="text-emerald-400 ml-1">Pump</span>
            </div>
            {candles.length > 0 && (
              <div className="text-[#AFFF00] font-bold flex items-center gap-1">
                <span className="text-[#AFFF00]">
                  {priceMode === 'usd' && currentPriceUsd 
                    ? formatUSD(currentPriceUsd) 
                    : currentPrice.toFixed(6)}
                </span>
                <span className="text-emerald-400">H</span>
                <span className="text-yellow-400">
                  {priceMode === 'usd' && currentPriceUsd 
                    ? formatUSD(Math.max(...candles.map(c => c.high)) * (currentPriceUsd / currentPrice))
                    : Math.max(...candles.map(c => c.high)).toFixed(6)}
                </span>
                <span className="text-red-400 ml-1">L</span>
                <span className="text-blue-400">
                  {priceMode === 'usd' && currentPriceUsd 
                    ? formatUSD(Math.min(...candles.map(c => c.low)) * (currentPriceUsd / currentPrice))
                    : Math.min(...candles.map(c => c.low)).toFixed(6)}
                </span>
                <span className="text-purple-400 ml-1">C</span>
                <span className="text-[#AFFF00]">
                  {priceMode === 'usd' && currentPriceUsd 
                    ? formatUSD(candles[candles.length - 1].close * (currentPriceUsd / currentPrice))
                    : candles[candles.length - 1].close.toFixed(6)}
                </span>
                <span className="text-emerald-400 ml-2">{showBubbles ? candles.length : '0'}</span>
                <span className="text-gray-500">
                  ({marketCapChangePercent24h !== undefined 
                    ? `${marketCapChangePercent24h >= 0 ? '+' : ''}${marketCapChangePercent24h.toFixed(2)}%`
                    : '+0.00%'})
                </span>
              </div>
            )}
            <div>
              Volume <span className="text-white font-bold">
                {priceMode === 'usd' && suiUsdPrice 
                  ? formatUSD(totalVolume * suiUsdPrice) 
                  : totalVolume.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Always render chart container so ref is available for initialization */}
        <div className="relative h-[450px] rounded-lg overflow-hidden">
          <div ref={chartContainerRef} className="w-full h-full" />
          
          {/* Overlay: Private Phase */}
          {isPrivatePhase && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] to-[#1e1e1e] flex items-center justify-center rounded">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-[#AFFF00]/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-[#AFFF00]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-1">
                    Private Session in Progress
                  </h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    Chart data hidden during private phase
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#AFFF00]/20 px-3 py-1.5 rounded-full text-xs font-bold text-white">
                  <Clock className="w-3 h-3" />
                  Reveals after settlement
                </div>
              </motion.div>
            </div>
          )})
          
          {/* Overlay: Loading */}
          {!isPrivatePhase && loading && (
            <div className="absolute inset-0 bg-[#0f0f0f]/95 flex items-center justify-center rounded">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#AFFF00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading chart data...</p>
              </div>
            </div>
          )}
          
          {/* Overlay: Error */}
          {!isPrivatePhase && !loading && error && (
            <div className="absolute inset-0 bg-[#1e1e1e]/95 flex items-center justify-center rounded">
              <div className="text-center">
                <p className="text-red-400 font-medium">Failed to load chart</p>
                <p className="text-xs text-red-300/60 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {/* Overlay: Empty State */}
          {!isPrivatePhase && !loading && !error && isEmpty && (
            <div className="absolute inset-0 bg-[#0f0f0f]/95 flex items-center justify-center rounded">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">No Trading History Yet</h3>
                  <p className="text-sm text-gray-400">
                    Be the first to trade {tokenSymbol}!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#26a69a] rounded"></div>
              <span>Up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ef5350] rounded"></div>
              <span>Down</span>
            </div>
          </div>
          <div className="font-mono">
            Live updates every 10s
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
