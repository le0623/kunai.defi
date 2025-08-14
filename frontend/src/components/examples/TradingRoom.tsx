import React, { useState, useEffect } from 'react'
import { useSocketIORoom, useSocketIOEvent } from '@/contexts/SocketIOContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TradeEvent {
  id: string
  token: string
  amount: number
  type: 'buy' | 'sell'
  timestamp: number
  user: string
}

export const TradingRoom: React.FC<{ tokenAddress: string }> = ({ tokenAddress }) => {
  const [trades, setTrades] = useState<TradeEvent[]>([])
  const [isJoined, setIsJoined] = useState(false)
  
  // Join the trading room for this specific token
  const { isConnected, emit, joinRoom, leaveRoom } = useSocketIORoom(`trades-${tokenAddress}`)
  
  // Listen to new trade events
  useSocketIOEvent('new-trade', (data: TradeEvent) => {
    console.log('New trade received:', data)
    setTrades(prev => [data, ...prev.slice(0, 9)]) // Keep last 10 trades
  })
  
  // Listen to trade updates
  useSocketIOEvent('trade-update', (data: { id: string; status: string }) => {
    console.log('Trade update received:', data)
    setTrades(prev => 
      prev.map(trade => 
        trade.id === data.id 
          ? { ...trade, status: data.status }
          : trade
      )
    )
  })

  const handlePlaceTrade = (type: 'buy' | 'sell', amount: number) => {
    if (!isConnected) {
      console.warn('Socket not connected')
      return
    }

    const tradeData = {
      token: tokenAddress,
      amount,
      type,
      timestamp: Date.now()
    }

    emit('place-trade', tradeData)
    console.log(`Placed ${type} trade:`, tradeData)
  }

  const handleJoinRoom = () => {
    joinRoom(`trades-${tokenAddress}`)
    setIsJoined(true)
  }

  const handleLeaveRoom = () => {
    leaveRoom(`trades-${tokenAddress}`)
    setIsJoined(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trading Room</span>
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} 
            />
            <span className="text-xs">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={handleJoinRoom} 
            disabled={!isConnected || isJoined}
            size="sm"
          >
            Join Room
          </Button>
          <Button 
            onClick={handleLeaveRoom} 
            disabled={!isConnected || !isJoined}
            variant="outline"
            size="sm"
          >
            Leave Room
          </Button>
        </div>

        {/* Quick Trade Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => handlePlaceTrade('buy', 0.1)}
            disabled={!isConnected || !isJoined}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            Buy 0.1 ETH
          </Button>
          <Button 
            onClick={() => handlePlaceTrade('sell', 0.1)}
            disabled={!isConnected || !isJoined}
            className="bg-red-600 hover:bg-red-700"
            size="sm"
          >
            Sell 0.1 ETH
          </Button>
        </div>

        {/* Recent Trades */}
        <div>
          <h4 className="text-sm font-medium mb-2">Recent Trades</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {trades.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trades yet</p>
            ) : (
              trades.map((trade) => (
                <div 
                  key={trade.id} 
                  className="text-xs p-2 bg-muted rounded"
                >
                  <div className="flex justify-between">
                    <span className={trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span>{trade.amount} ETH</span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 