import { shortenAddress } from '@/lib/utils';

interface ProxyTrade {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  status: string;
  txHash?: string;
  createdAt: string;
  executedAt?: string;
}

interface TradingTabProps {
  proxyWallet: any;
}

export default function TradingTab({ proxyWallet }: TradingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Quick Trade</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token Address</label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.05"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition-colors">
            Execute Trade
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
        <div className="space-y-3">
          {proxyWallet?.trades?.map((trade: ProxyTrade) => (
            <div key={trade.id} className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">
                  {trade.tokenIn} → {trade.tokenOut}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${trade.status === 'executed' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                  {trade.status}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Amount: {trade.amountIn} {trade.tokenIn}
              </div>
              {trade.txHash && (
                <div className="text-xs text-gray-500 mt-1">
                  TX: {shortenAddress(trade.txHash)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 