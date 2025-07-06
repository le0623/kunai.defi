import { CheckCircle, XCircle, Wallet, Copy, Settings, Loader2 } from 'lucide-react';
import { shortenAddress, showAlert } from '@/lib/utils';
import { useState } from 'react';
import api from '@/lib/axios';

interface ProxyWallet {
  id: string;
  userAddress: string;
  proxyAddress: string;
  maxTradeAmount: string;
  maxSlippage: number;
  dailyTradeLimit: string;
  isActive: boolean;
  deployedAt: string;
  approvals: any[];
  trades: any[];
}

interface DashboardTabProps {
  proxyWallet: ProxyWallet | null;
  pools: any[];
  isMonitoring: boolean;
  executeTrade: (pool: any) => void;
  copyToClipboard: (text: string) => void;
}

export default function DashboardTab({
  proxyWallet,
  isMonitoring,
  copyToClipboard,
}: DashboardTabProps) {
  const [monitoring, setMonitoring] = useState(isMonitoring);
  const [isLoading, setIsLoading] = useState(false);

  const toggleMonitoring = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/api/telegram-webapp/monitor-pool', {
        isMonitoring: !monitoring
      });

      if (response.data.success) {
        setMonitoring(response.data.data.isMonitoring);
        showAlert(monitoring ? 'Monitoring stopped' : 'Monitoring started! You will receive alerts for new opportunities.');
      } else {
        showAlert(response.data.error || 'Failed to toggle monitoring');
      }
    } catch (error) {
      showAlert('Error toggling monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-2">Monitoring Status</h3>
          <div className="flex items-center gap-2">
            {monitoring ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
            <span className="font-semibold">
              {monitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-2">Total Trades</h3>
          <span className="text-2xl font-bold">
            {proxyWallet?.trades?.length || 0}
          </span>
        </div>
      </div>

      {/* Simple Monitoring Toggle */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Pool Monitoring</h3>
            <p className="text-sm text-gray-400">
              {monitoring ? 'Monitoring active - You will receive alerts for new opportunities' : 'Monitoring inactive'}
            </p>
          </div>
          <button
            onClick={toggleMonitoring}
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              isLoading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : monitoring
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              monitoring ? 'Stop' : 'Start'
            )}
          </button>
        </div>
      </div>

      {/* Proxy Wallet Information */}
      {proxyWallet && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet size={20} />
            Proxy Wallet
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Proxy Address:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{shortenAddress(proxyWallet.proxyAddress)}</span>
                <button
                  onClick={() => copyToClipboard(proxyWallet.proxyAddress)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Trade:</span>
              <span>{proxyWallet.maxTradeAmount} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Slippage:</span>
              <span>{proxyWallet.maxSlippage / 100}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Daily Limit:</span>
              <span>{proxyWallet.dailyTradeLimit} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={proxyWallet.isActive ? 'text-green-500' : 'text-red-500'}>
                {proxyWallet.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Deployed:</span>
              <span>{new Date(proxyWallet.deployedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings size={20} />
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Total Approvals</div>
            <div className="text-xl font-bold">{proxyWallet?.approvals?.length || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Successful Trades</div>
            <div className="text-xl font-bold text-green-500">
              {proxyWallet?.trades?.filter(t => t.status === 'executed').length || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Pending Trades</div>
            <div className="text-xl font-bold text-yellow-500">
              {proxyWallet?.trades?.filter(t => t.status === 'pending').length || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Failed Trades</div>
            <div className="text-xl font-bold text-red-500">
              {proxyWallet?.trades?.filter(t => t.status === 'failed').length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 