'use client'

import { useEffect, useRef, useLayoutEffect } from 'react'
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
import { TrendingUp, Clock, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TradingChartProps {
  tokenId: string
  tokenSymbol: string
  currentPhase: number
  isPrivatePhase: boolean
  intervalMinutes?: number
}

export function TradingChart({
  tokenId,
  tokenSymbol,
  currentPhase,
  isPrivatePhase,
  intervalMinutes = 1
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)

  const { candles, volumeData, loading, error, isEmpty } = useChartData(
    tokenId,
    intervalMinutes,
    !isPrivatePhase // Only auto-refresh when not in private phase
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
    <Card className="border-2 bg-[#0f0f0f]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#AFFF00]" />
            Price Chart
          </h3>
          <div className="text-xs text-gray-400 font-mono">
            {candles.length} candles • {intervalMinutes}m interval
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
