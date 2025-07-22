import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import Web3Provider from '@/components/web3-provider'
import Layout from '@/components/layout/Layout'
import WebAppLayout from '@/components/layout/WebAppLayout'
import Dashboard from '@/pages/Dashboard'
import WalletMonitor from '@/pages/WalletMonitor'
import TradingBot from '@/pages/TradingBot'
import CopyTrade from '@/pages/CopyTrade'
import Terminal from '@/pages/Terminal'
import TelegramWebApp from '@/pages/TelegramWebApp'
import NewPair from '@/pages/NewPair'
import TokenDetail from '@/pages/TokenDetail'
import ProxyWalletCreate from '@/components/telegram/ProxyWalletCreate'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import AuthDialog from '@/components/common/auth-dialog'
import PresetsSettingsModal from '@/components/modals/PresetsSettingsModal'

const queryClient = new QueryClient()

function App() {
  return (
    <Web3Provider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <AuthProvider>
            <Router>
              <Routes>
                {/* Telegram WebApp Routes */}
                <Route path="/webapp" element={<WebAppLayout><Outlet /></WebAppLayout>}>
                  <Route index element={<TelegramWebApp />} />
                  <Route path="deploy-wallet" element={<ProxyWalletCreate />} />
                </Route>

                {/* Main App Routes */}
                <Route path="/" element={<Layout><Outlet /></Layout>}>
                  <Route index element={<Dashboard />} />
                  <Route path="new-pair" element={<NewPair />} />
                  <Route path="wallet-monitor" element={<WalletMonitor />} />
                  <Route path="trading-bot" element={<TradingBot />} />
                  <Route path="copy-trade" element={<CopyTrade />} />
                  <Route path="terminal" element={<Terminal />} />
                  <Route path=":chain/token/:tokenAddress" element={<TokenDetail />} />
                </Route>
              </Routes>
            </Router>
            <AuthDialog />
            <PresetsSettingsModal />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Web3Provider>
  )
}

export default App
