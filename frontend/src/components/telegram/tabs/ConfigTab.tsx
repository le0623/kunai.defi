import { useState } from "react";

interface SniperConfig {
  id: string;
  name: string;
  isActive: boolean;
  maxSlippage: number;
  gasLimit: number;
  gasPrice: number;
  maxBuyAmount: number;
  autoSell: boolean;
  sellPercentage: number;
  targetChains: string[];
  targetDexs: string[];
  filters: {
    minLiquidity: number;
    maxBuyTax: number;
    maxSellTax: number;
    minMarketCap: number;
    maxMarketCap: number;
    honeypotCheck: boolean;
    lockCheck: boolean;
  };
}

interface ConfigTabProps {
  sniperConfig: SniperConfig | null;
}

export default function ConfigTab({ sniperConfig: initialSniperConfig }: ConfigTabProps) {
  const [sniperConfig, setSniperConfig] = useState<SniperConfig | null>(initialSniperConfig);

  return (
    <div className="space-y-6">
      {sniperConfig ? (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Sniper Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Slippage (%)</label>
                <input
                  type="number"
                  value={sniperConfig.maxSlippage}
                  onChange={(e) => setSniperConfig(prev => prev ? { ...prev, maxSlippage: parseFloat(e.target.value) } : null)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gas Limit</label>
                <input
                  type="number"
                  value={sniperConfig.gasLimit}
                  onChange={(e) => setSniperConfig(prev => prev ? { ...prev, gasLimit: parseInt(e.target.value) } : null)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Buy Amount (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sniperConfig.maxBuyAmount}
                  onChange={(e) => setSniperConfig(prev => prev ? { ...prev, maxBuyAmount: parseFloat(e.target.value) } : null)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sell Percentage (%)</label>
                <input
                  type="number"
                  value={sniperConfig.sellPercentage}
                  onChange={(e) => setSniperConfig(prev => prev ? { ...prev, sellPercentage: parseFloat(e.target.value) } : null)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sniperConfig.autoSell}
                onChange={(e) => setSniperConfig(prev => prev ? { ...prev, autoSell: e.target.checked } : null)}
                className="rounded"
              />
              <label className="text-sm">Auto Sell</label>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition-colors">
              Save Configuration
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-400 mb-4">No configuration found</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
            Create Configuration
          </button>
        </div>
      )}
    </div>
  );
} 