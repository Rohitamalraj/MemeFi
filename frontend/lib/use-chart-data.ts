import { useState, useEffect } from 'react'
import { getSuiClient } from './sui-client'
import { MEMEFI_CONFIG } from './contract-config'

export interface Trade {
  price: number
  amount: number
  timestamp: number
  buyer: string
  phase: number
  type: 'buy' | 'sell' // Track trade type
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface VolumeData {
  time: number
  value: number
  color: string
}

// Convert trades to candles for a given interval (in seconds)
function aggregateCandles(trades: Trade[], intervalSeconds: number): CandleData[] {
  if (trades.length === 0) return []

  // Sort trades by timestamp
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)

  // Group trades into intervals
  const candleMap = new Map<number, Trade[]>()

  for (const trade of sortedTrades) {
    const intervalStart = Math.floor(trade.timestamp / intervalSeconds) * intervalSeconds
    if (!candleMap.has(intervalStart)) {
      candleMap.set(intervalStart, [])
    }
    candleMap.get(intervalStart)!.push(trade)
  }

  // If we have very few trades, use individual trades as candles
  if (candleMap.size === 0 && sortedTrades.length > 0) {
    // Create a candle for each trade
    return sortedTrades.map(trade => ({
      time: trade.timestamp,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.amount
    }))
  }

  // Convert to candles
  const candles: CandleData[] = []

  for (const [time, intervalTrades] of candleMap) {
    if (intervalTrades.length === 0) continue

    const prices = intervalTrades.map(t => t.price)
    const open = intervalTrades[0].price
    const close = intervalTrades[intervalTrades.length - 1].price
    let high = Math.max(...prices)
    let low = Math.min(...prices)
    const volume = intervalTrades.reduce((sum, t) => sum + t.amount, 0)

    // Ensure high/low create visible wicks (at least 0.1% variation)
    // This prevents candlesticks from looking like blocks
    if (high === low || (high - low) / low < 0.001) {
      const midpoint = (high + low) / 2
      high = midpoint * 1.0005  // +0.05% for high
      low = midpoint * 0.9995   // -0.05% for low
    }
    
    // Ensure high is above both open and close
    high = Math.max(high, open, close)
    // Ensure low is below both open and close
    low = Math.min(low, open, close)

    candles.push({ time, open, high, low, close, volume })
  }

  return candles.sort((a, b) => a.time - b.time)
}

// Generate volume data with colors based on trade type
function generateVolumeData(candles: CandleData[], trades: Trade[]): VolumeData[] {
  return candles.map(candle => {
    // Find trades in this candle's time period
    const candleTrades = trades.filter(t => 
      Math.floor(t.timestamp / 60) === Math.floor(candle.time / 60)
    )
    
    // If there are any sells in this candle, show red; otherwise green
    const hasSell = candleTrades.some(t => t.type === 'sell')
    
    return {
      time: candle.time,
      value: candle.volume,
      color: hasSell ? 'rgba(239, 83, 80, 0.5)' : 'rgba(38, 166, 154, 0.5)'
    }
  })
}

export function useChartData(tokenId: string, intervalMinutes: number = 1, autoRefresh: boolean = true) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [candles, setCandles] = useState<CandleData[]>([])
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let refreshInterval: NodeJS.Timeout | null = null
    let retryCount = 0
    const maxRetries = 3

    async function fetchTradeHistory() {
      try {
        const client = getSuiClient()

        console.log('📈 Fetching trade history for token:', tokenId)

        // First, get the token object to know total supply AND current circulating supply
        const tokenObject = await client.getObject({
          id: tokenId,
          options: { showContent: true }
        })

        let totalSupply = 1000000000 // Default 1B
        let currentCirculatingSupply = 0

        if (tokenObject.data && tokenObject.data.content && tokenObject.data.content.dataType === 'moveObject') {
          const fields = tokenObject.data.content.fields as any
          totalSupply = Number(fields.total_supply || 1000000000)
          currentCirculatingSupply = Number(fields.circulating_supply || 0)
          console.log('📈 Token info:', { totalSupply, currentCirculatingSupply })
        }

        // Query both PurchaseMade AND TokensSold events for this token
        const [buyEvents, sellEvents] = await Promise.all([
          client.queryEvents({
            query: {
              MoveEventType: `${MEMEFI_CONFIG.packageId}::token_v2::PurchaseMade`
            },
            order: 'ascending',
          }),
          client.queryEvents({
            query: {
              MoveEventType: `${MEMEFI_CONFIG.packageId}::token_v2::TokensSold`
            },
            order: 'ascending',
          })
        ])

        console.log('📈 Buy events:', buyEvents.data.length, 'Sell events:', sellEvents.data.length)

        // Combine and parse all events
        const allEvents: Array<{
          type: 'buy' | 'sell'
          tokenId: string
          amount: number
          timestamp: number
          user: string
        }> = []

        // Parse buy events
        for (const event of buyEvents.data) {
          try {
            const eventData = event.parsedJson as any
            if (eventData.token_id !== tokenId) continue

            allEvents.push({
              type: 'buy',
              tokenId: eventData.token_id,
              amount: Number(eventData.token_amount || 0),
              timestamp: Math.floor(Number(event.timestampMs || Date.now()) / 1000),
              user: eventData.buyer || 'unknown'
            })
          } catch (err) {
            console.warn('Failed to parse buy event:', err)
          }
        }

        // Parse sell events
        for (const event of sellEvents.data) {
          try {
            const eventData = event.parsedJson as any
            if (eventData.token_id !== tokenId) continue

            allEvents.push({
              type: 'sell',
              tokenId: eventData.token_id,
              amount: Number(eventData.token_amount || 0),
              timestamp: Math.floor(Number(event.timestampMs || Date.now()) / 1000),
              user: eventData.seller || 'unknown'
            })
          } catch (err) {
            console.warn('Failed to parse sell event:', err)
          }
        }

        // Sort all events chronologically
        allEvents.sort((a, b) => a.timestamp - b.timestamp)

        console.log('📈 Total events:', allEvents.length)

        // Process events and calculate prices based on bonding curve
        const tokenTrades: Trade[] = []
        let runningSupply = 0 // Track supply as we process events chronologically

        for (const event of allEvents) {
          const basePrice = 0.0001

          if (event.type === 'buy') {
            // For buys: calculate price at current supply, then add to supply
            const supplyPercent = runningSupply / totalSupply
            const price = basePrice * (1 + 99 * supplyPercent)
            
            runningSupply += event.amount // Increase supply after buy
            
            const amountInTokens = event.amount / 1_000_000_000
            
            console.log('📈 BUY:', { 
              price: price.toFixed(6), 
              amount: amountInTokens.toFixed(2), 
              timestamp: event.timestamp,
              user: event.user.slice(0, 8) + '...',
              supply: (runningSupply / totalSupply * 100).toFixed(4) + '%'
            })

            tokenTrades.push({
              price,
              amount: amountInTokens,
              timestamp: event.timestamp,
              buyer: event.user,
              phase: 3,
              type: 'buy'
            })
          } else {
            // For sells: calculate price at current supply, then subtract from supply
            const supplyPercent = runningSupply / totalSupply
            const price = basePrice * (1 + 99 * supplyPercent)
            
            runningSupply -= event.amount // Decrease supply after sell
            
            const amountInTokens = event.amount / 1_000_000_000
            
            console.log('📈 SELL:', { 
              price: price.toFixed(6), 
              amount: amountInTokens.toFixed(2), 
              timestamp: event.timestamp,
              user: event.user.slice(0, 8) + '...',
              supply: (runningSupply / totalSupply * 100).toFixed(4) + '%'
            })

            tokenTrades.push({
              price,
              amount: amountInTokens,
              timestamp: event.timestamp,
              buyer: event.user, // Store seller in buyer field for simplicity
              phase: 3,
              type: 'sell'
            })
          }
        }

        if (!mounted) return

        console.log('📈 Total trades for token:', tokenTrades.length)

        // Sort by timestamp (oldest first) - should already be sorted  
        tokenTrades.sort((a, b) => a.timestamp - b.timestamp)

        setTrades(tokenTrades)

        // Generate candles
        const intervalSeconds = intervalMinutes * 60
        const candleData = aggregateCandles(tokenTrades, intervalSeconds)
        
        console.log('📈 Generated candles:', candleData.length, candleData)
        
        setCandles(candleData)

        // Generate volume data
        const volData = generateVolumeData(candleData, tokenTrades)
        setVolumeData(volData)

        setError(null)
        retryCount = 0 // Reset retry count on success
      } catch (err: any) {
        console.error('Error fetching trade history:', err)
        
        // Retry on network errors
        if (mounted && retryCount < maxRetries && (err.message?.includes('Failed to fetch') || err.message?.includes('network'))) {
          retryCount++
          console.log(`📈 Retrying... (${retryCount}/${maxRetries})`)
          setTimeout(() => {
            if (mounted) fetchTradeHistory()
          }, 1000 * retryCount) // Exponential backoff
          return
        }
        
        if (mounted) {
          setError(err.message || 'Failed to load chart data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initial fetch
    fetchTradeHistory()

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      refreshInterval = setInterval(fetchTradeHistory, 10000) // Refresh every 10 seconds
    }

    return () => {
      mounted = false
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [tokenId, intervalMinutes, autoRefresh])

  return {
    trades,
    candles,
    volumeData,
    loading,
    error,
    isEmpty: trades.length === 0
  }
}
