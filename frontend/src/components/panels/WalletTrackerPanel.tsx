import React from 'react'
import DraggablePanel from './DraggablePanel'
import { Wallet, TrendingUp, Activity, DollarSign } from 'lucide-react'

interface WalletTrackerPanelProps {
  panelId: string
}

const WalletTrackerPanel: React.FC<WalletTrackerPanelProps> = ({ panelId }) => {
  return (
    <DraggablePanel
      panelId={panelId}
      title="Wallet Tracker"
      defaultPosition={{ x: 100, y: 100 }}
      minWidth={400}
      minHeight={300}
    >
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Balance</span>
            </div>
            <div className="text-lg font-bold">$12,345.67</div>
            <div className="text-xs text-green-500">+2.5% today</div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">24h PnL</span>
            </div>
            <div className="text-lg font-bold text-green-500">+$234.56</div>
            <div className="text-xs text-green-500">+1.9%</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity
          </h4>
          <div className="space-y-2">
            {[
              { type: 'buy', token: 'ETH', amount: '0.5', price: '$2,450', time: '2 min ago' },
              { type: 'sell', token: 'USDC', amount: '1,000', price: '$1.00', time: '15 min ago' },
              { type: 'buy', token: 'MATIC', amount: '500', price: '$0.85', time: '1 hour ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activity.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">{activity.token}</span>
                  <span className="text-xs text-muted-foreground">{activity.amount}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm">{activity.price}</div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              Add Wallet
            </button>
            <button className="p-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
              Track Token
            </button>
          </div>
        </div>
      </div>
    </DraggablePanel>
  )
}

export default WalletTrackerPanel 