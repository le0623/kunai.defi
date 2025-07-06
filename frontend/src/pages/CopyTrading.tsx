import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Copy, Users, TrendingUp, Eye } from 'lucide-react'

const CopyTrading = () => {
  const [selectedTrader, setSelectedTrader] = useState('')
  const [copyAmount, setCopyAmount] = useState('')

  const traders = [
    {
      id: '1',
      name: 'CryptoWhale',
      address: '0x1234...5678',
      winRate: 85,
      totalTrades: 156,
      profit: '+45.2%',
      followers: 1247,
      status: 'active'
    },
    {
      id: '2',
      name: 'DeFiMaster',
      address: '0x8765...4321',
      winRate: 78,
      totalTrades: 89,
      profit: '+32.1%',
      followers: 892,
      status: 'active'
    },
    {
      id: '3',
      name: 'NFTTrader',
      address: '0x9876...5432',
      winRate: 92,
      totalTrades: 234,
      profit: '+67.8%',
      followers: 2156,
      status: 'inactive'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Copy Trading</h1>
        <Button>
          <Copy className="h-4 w-4 mr-2" />
          Start Copying
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Traders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Traders
            </CardTitle>
            <CardDescription>
              Follow successful traders and copy their strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trader</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Total Trades</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traders.map((trader) => (
                  <TableRow key={trader.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trader.name}</div>
                        <div className="text-sm text-muted-foreground">{trader.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{trader.winRate}%</Badge>
                    </TableCell>
                    <TableCell>{trader.totalTrades}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{trader.profit}</span>
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {trader.followers}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trader.status === 'active' ? 'default' : 'outline'}>
                        {trader.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTrader(trader.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Copy Trading Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Copy Trading Setup</CardTitle>
            <CardDescription>
              Configure your copy trading parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Trader</label>
              <select 
                value={selectedTrader} 
                onChange={(e) => setSelectedTrader(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Choose a trader...</option>
                {traders.map((trader) => (
                  <option key={trader.id} value={trader.id}>
                    {trader.name} ({trader.winRate}% win rate)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Copy Amount (ETH)</label>
              <Input
                type="number"
                placeholder="0.1"
                value={copyAmount}
                onChange={(e) => setCopyAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Copy Percentage</label>
              <select className="w-full p-2 border border-input rounded-md bg-background">
                <option value="25">25% of trader's position</option>
                <option value="50">50% of trader's position</option>
                <option value="75">75% of trader's position</option>
                <option value="100">100% of trader's position</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Copy</label>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <Button className="w-full" disabled={!selectedTrader}>
              <Copy className="h-4 w-4 mr-2" />
              Start Copying
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Copy Trades */}
      <Card>
        <CardHeader>
          <CardTitle>My Copy Trades</CardTitle>
          <CardDescription>
            Track your active copy trading positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active copy trades</p>
            <p className="text-sm">Start copying a trader to see your positions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CopyTrading 