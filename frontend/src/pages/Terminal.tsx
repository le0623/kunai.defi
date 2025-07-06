import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Terminal as TerminalIcon, Send, History, Settings } from 'lucide-react'

const Terminal = () => {
  const [command, setCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      setCommandHistory([...commandHistory, command])
      setCommand('')
    }
  }

  const recentCommands = [
    { id: 1, command: 'monitor 0x1234...5678', timestamp: '2 min ago', status: 'success' },
    { id: 2, command: 'analyze contract 0xabcd...efgh', timestamp: '5 min ago', status: 'success' },
    { id: 3, command: 'set gas 25', timestamp: '10 min ago', status: 'success' },
    { id: 4, command: 'buy ETH 0.1', timestamp: '15 min ago', status: 'error' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Terminal</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Connected</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Console */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalIcon className="h-5 w-5" />
              Console
            </CardTitle>
            <CardDescription>
              Execute commands and monitor blockchain activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Terminal Output */}
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
              <div className="mb-2">
                <span className="text-blue-400">$</span> Welcome to Kunai Terminal v1.0.0
              </div>
              <div className="mb-2">
                <span className="text-blue-400">$</span> Type 'help' for available commands
              </div>
              {commandHistory.map((cmd, index) => (
                <div key={index} className="mb-2">
                  <div>
                    <span className="text-blue-400">$</span> {cmd}
                  </div>
                  <div className="text-gray-400 ml-4">
                    Command executed successfully
                  </div>
                </div>
              ))}
            </div>

            {/* Command Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="font-mono"
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Commands</CardTitle>
            <CardDescription>
              Common commands for quick access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCommand('help')}
            >
              help
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCommand('status')}
            >
              status
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCommand('monitor')}
            >
              monitor [address]
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCommand('analyze')}
            >
              analyze [contract]
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCommand('gas')}
            >
              gas [price]
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Commands
          </CardTitle>
          <CardDescription>
            View your recent terminal commands and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Command</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCommands.map((cmd) => (
                <TableRow key={cmd.id}>
                  <TableCell className="font-mono text-sm">{cmd.command}</TableCell>
                  <TableCell>{cmd.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={cmd.status === 'success' ? 'default' : 'destructive'}>
                      {cmd.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCommand(cmd.command)}
                    >
                      Re-run
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Commands</CardTitle>
          <CardDescription>
            Reference for all available terminal commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Monitoring</h4>
              <div className="text-sm space-y-1">
                <div><code className="bg-muted px-1 rounded">monitor [address]</code> - Monitor wallet</div>
                <div><code className="bg-muted px-1 rounded">unmonitor [address]</code> - Stop monitoring</div>
                <div><code className="bg-muted px-1 rounded">list monitors</code> - Show active monitors</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Trading</h4>
              <div className="text-sm space-y-1">
                <div><code className="bg-muted px-1 rounded">buy [token] [amount]</code> - Buy tokens</div>
                <div><code className="bg-muted px-1 rounded">sell [token] [amount]</code> - Sell tokens</div>
                <div><code className="bg-muted px-1 rounded">balance</code> - Show balance</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Analysis</h4>
              <div className="text-sm space-y-1">
                <div><code className="bg-muted px-1 rounded">analyze [contract]</code> - Analyze contract</div>
                <div><code className="bg-muted px-1 rounded">risk [address]</code> - Risk assessment</div>
                <div><code className="bg-muted px-1 rounded">portfolio</code> - Portfolio overview</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Settings</h4>
              <div className="text-sm space-y-1">
                <div><code className="bg-muted px-1 rounded">gas [price]</code> - Set gas price</div>
                <div><code className="bg-muted px-1 rounded">slippage [%]</code> - Set slippage</div>
                <div><code className="bg-muted px-1 rounded">config</code> - Show config</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Terminal 