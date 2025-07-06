import { useEffect, useState } from 'react';
import {
  Settings,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import WebApp from "@twa-dev/sdk";
import type { Telegram } from "@twa-dev/types";
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.svg';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DashboardTab,
  ConfigTab,
  TradingTab,
  PortfolioTab,
  AlertsTab
} from '@/components/telegram/tabs';
import { showAlert } from '@/lib/utils';

interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  isMonitoring: boolean;
  isActive: boolean;
  proxyWallet: ProxyWallet | null;
  sniperConfigs: SniperConfig[] | null;
}

interface ProxyWallet {
  id: string;
  userAddress: string;
  proxyAddress: string;
  maxTradeAmount: string;
  maxSlippage: number;
  dailyTradeLimit: string;
  isActive: boolean;
  deployedAt: string;
  approvals: ProxyApproval[];
  trades: ProxyTrade[];
}

interface ProxyApproval {
  id: string;
  tokenAddress: string;
  amount: string;
  createdAt: string;
  status: string;
}

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

interface Pool {
  id: string;
  base_token_info: {
    symbol: string;
    name: string;
    address: string;
    market_cap: string;
    volume: string;
    buy_tax: number;
    sell_tax: number;
    is_honeypot: boolean;
  };
  exchange: string;
  chain: string;
  open_timestamp: number;
  lockInfo: {
    isLock: boolean;
  };
}

declare global {
  interface Window {
    Telegram: Telegram;
  }
}

type WebApp = Telegram["WebApp"];

export default function TelegramWebApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pools, setPools] = useState<Pool[]>([]);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const initData = WebApp.initData;

    api.interceptors.request.use(
      (config) => {
        if (initData) {
          config.headers['telegram-init-data'] = initData;
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Load user data from backend
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/telegram-webapp/me');

      if (response.data.success) {
        setUser(response.data.data);

        // Load pools only if user has proxy wallet
        if (response.data.data.proxyWallet) {
          loadPools();
        } else {
          navigate('/webapp/deploy-wallet');
        }
      }

    } catch (error) {
      if (error instanceof AxiosError) {
        showAlert(error.response?.data.error || 'Error loading user data');
      } else {
        showAlert('Error loading user data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPools = async () => {
    try {
      // TODO: Replace with actual API call
      const mockPools: Pool[] = [
        {
          id: '1',
          base_token_info: {
            symbol: 'TOKEN1',
            name: 'Test Token 1',
            address: '0x1234567890123456789012345678901234567890',
            market_cap: '500000',
            volume: '25000',
            buy_tax: 5,
            sell_tax: 5,
            is_honeypot: false
          },
          exchange: 'Uniswap V2',
          chain: 'eth',
          open_timestamp: Date.now() / 1000 - 3600,
          lockInfo: { isLock: true }
        },
        {
          id: '2',
          base_token_info: {
            symbol: 'TOKEN2',
            name: 'Test Token 2',
            address: '0x2345678901234567890123456789012345678901',
            market_cap: '750000',
            volume: '45000',
            buy_tax: 3,
            sell_tax: 3,
            is_honeypot: false
          },
          exchange: 'PancakeSwap',
          chain: 'bsc',
          open_timestamp: Date.now() / 1000 - 1800,
          lockInfo: { isLock: true }
        }
      ];

      setPools(mockPools);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  const showConfirm = (message: string, callback: (confirmed: boolean) => void) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.showConfirm(message, callback);
    } else {
      const confirmed = confirm(message);
      callback(confirmed);
    }
  };

  const executeTrade = async (pool: Pool) => {
    try {
      showConfirm(`Execute trade for ${pool.base_token_info.symbol}?`, async (confirmed) => {
        if (confirmed) {
          // TODO: Replace with actual API call
          // await fetch('/api/telegram/trade', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({
          //     tokenAddress: pool.base_token_info.address,
          //     amount: '0.05'
          //   })
          // });

          showAlert('Trade executed successfully!');
          loadUserData();
        }
      });
    } catch (error) {
      console.error('Error executing trade:', error);
      showAlert('Error executing trade');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      label: 'Dashboard',
      icon: <TrendingUp size={16} />,
      component: <DashboardTab
        proxyWallet={user?.proxyWallet || null}
        pools={pools}
        isMonitoring={user?.isMonitoring ?? false}
        executeTrade={executeTrade}
        copyToClipboard={copyToClipboard}
      />
    },
    {
      label: 'Config',
      icon: <Settings size={16} />,
      component: <ConfigTab
        sniperConfig={user?.sniperConfigs?.[0] || null}
      />
    },
    {
      label: 'Trading',
      icon: <TrendingUp size={16} />,
      component: <TradingTab
        proxyWallet={user?.proxyWallet}
      />
    },
    {
      label: 'Portfolio',
      icon: <TrendingUp size={16} />,
      component: <PortfolioTab
        proxyWallet={user?.proxyWallet}
      />
    },
    {
      label: 'Alerts',
      icon: <AlertTriangle size={16} />,
      component: <AlertsTab />
    }
  ]

  return (
    <div className="min-h-screen w-screen bg-gray-900 text-white">
      {/* Header */}

      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <img src={logo} alt="KunAI Sniper Bot" className="w-6 h-6 mr-2" />
              <span className="text-white">KunAI Sniper Bot</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {user?.firstName} {user?.lastName} (@{user?.username})
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <Tabs className="w-full" defaultValue={tabs[0].label}>
          <TabsList className="flex w-full bg-gray-700 rounded-none p-0">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.label} className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-none">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content */}
          <div className="p-4 flex-1 overflow-y-scroll overflow-x-clip">
            {tabs.map((tab) => (
              <TabsContent key={tab.label} value={tab.label}>
                {tab.component}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
} 