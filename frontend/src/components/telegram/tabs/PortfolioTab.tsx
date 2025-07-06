interface PortfolioTabProps {
  proxyWallet: any;
}

export default function PortfolioTab({ proxyWallet }: PortfolioTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Portfolio Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Total Value</div>
            <div className="text-2xl font-bold">$6,500.00</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">24h Change</div>
            <div className="text-2xl font-bold text-green-500">+$250.00</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Holdings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="font-semibold">ETH</div>
              <div className="text-sm text-gray-400">2.5 ETH</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">$5,000.00</div>
              <div className="text-sm text-green-500">+2.5%</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="font-semibold">USDC</div>
              <div className="text-sm text-gray-400">1,000 USDC</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">$1,000.00</div>
              <div className="text-sm text-gray-400">0.0%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Total Trades</div>
            <div className="text-xl font-bold">{proxyWallet?.trades?.length || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold">68%</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Profit</div>
            <div className="text-xl font-bold text-green-500">$3,420</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Best Trade</div>
            <div className="text-xl font-bold text-green-500">+$1,250</div>
          </div>
        </div>
      </div>
    </div>
  );
} 