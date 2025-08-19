import React from 'react'
import DraggablePanel from './DraggablePanel'
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react'

interface HoldingPanelProps {
  panelId: string
}

const HoldingPanel: React.FC<HoldingPanelProps> = ({ panelId }) => {
  return (
    <DraggablePanel
      panelId={panelId}
      title="Holdings"
      defaultPosition={{ x: 200, y: 100 }}
      minWidth={450}
      minHeight={350}
    >
      <div className="space-y-4">
        {/* Portfolio Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Portfolio Value
            </h4>
            <span className="text-xs text-muted-foreground">Last updated: 2 min ago</span>
          </div>
          <div className="text-2xl font-bold">$45,678.90</div>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">+$1,234.56 (+2.8%)</span>
            <span className="text-xs text-muted-foreground">24h</span>
          </div>
        </div>

        {/* Holdings List */}
        <div>
          <h4 className="text-sm font-medium mb-3">Your Holdings</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[
              { token: 'ETH', amount: '2.5', value: '$6,125.00', change: '+5.2%', changeValue: '+$302.50' },
              { token: 'USDC', amount: '15,000', value: '$15,000.00', change: '0.0%', changeValue: '$0.00' },
              { token: 'MATIC', amount: '8,000', value: '$6,800.00', change: '+3.1%', changeValue: '+$204.00' },
              { token: 'LINK', amount: '500', value: '$8,750.00', change: '+1.8%', changeValue: '+$154.00' },
              { token: 'UNI', amount: '1,200', value: '$9,003.90', change: '-0.5%', changeValue: '-$45.00' },
            ].map((holding, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {holding.token.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{holding.token}</div>
                    <div className="text-xs text-muted-foreground">{holding.amount} tokens</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{holding.value}</div>
                  <div className={`text-xs ${holding.change.startsWith('+') ? 'text-green-500' : holding.change.startsWith('-') ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {holding.change} ({holding.changeValue})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button className="flex-1 p-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
            Add Token
          </button>
          <button className="flex-1 p-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
            Export Data
          </button>
        </div>
      </div>
    </DraggablePanel>
  )
}

export default HoldingPanel 