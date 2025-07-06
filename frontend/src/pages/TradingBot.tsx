import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Play, Square, Settings } from 'lucide-react'

const TradingBot = () => {
  const [isActive, setIsActive] = useState(false)
  const [strategy, setStrategy] = useState('dca')
  const [amount, setAmount] = useState('')
  const [interval, setInterval] = useState('daily')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Bot</h1>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              Configure your automated trading bot settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Strategy</label>
              <select 
                value={strategy} 
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="dca">Dollar Cost Averaging</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="momentum">Momentum Trading</option>
                <option value="mean-reversion">Mean Reversion</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount per trade (ETH)</label>
              <Input
                type="number"
                placeholder="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trading Interval</label>
              <select 
                value={interval} 
                onChange={(e) => setInterval(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Trading</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Bot Status
            </CardTitle>
            <CardDescription>
              Monitor your bot's performance and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">+0.00%</div>
                <div className="text-sm text-muted-foreground">Profit/Loss</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Last Trade</span>
                <span className="text-muted-foreground">Never</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Next Trade</span>
                <span className="text-muted-foreground">Not scheduled</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setIsActive(true)}
                disabled={isActive}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Bot
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsActive(false)}
                disabled={!isActive}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Bot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            View your bot's recent trading activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trading activity yet</p>
            <p className="text-sm">Start your bot to see trading history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TradingBot 