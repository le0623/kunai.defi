import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
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
import Portfolio from '@/pages/Portfolio'
import ProxyWalletCreate from '@/components/telegram/ProxyWalletCreate'
import { ThemeProvider } from '@/components/theme-provider'
import AuthDialog from '@/components/common/auth-dialog'
import PresetsSettingsModal from '@/components/modals/PresetsSettingsModal'
import DepositSheet from '@/components/common/deposit-sheet'
import { Toaster } from '@/components/ui/sonner'
import TelegramAuth from '@/pages/TelegramAuth'
import { Navigate } from 'react-router-dom'
import DebugRouter from '@/components/DebugRouter'
import { SocketIOProvider } from '@/contexts/SocketIOContext'

const queryClient = new QueryClient()

function App() {
  return (
    <Web3Provider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <SocketIOProvider>
            <BrowserRouter>
              <DebugRouter />
                <Routes>
                  {/* Telegram WebApp Routes */}
                  <Route path="/webapp" element={<WebAppLayout><Outlet /></WebAppLayout>}>
                    <Route index element={<TelegramWebApp />} />
                    <Route path="deploy-wallet" element={<ProxyWalletCreate />} />
                  <Route path="*" element={<Navigate to="/webapp" replace />} />
                  </Route>

                  {/* Main App Routes */}
                  <Route path="/" element={<Layout><Outlet /></Layout>}>
                    <Route index element={<Dashboard />} />
                    <Route path="new-pair" element={<NewPair />} />
                    <Route path="portfolio" element={<Portfolio />} />
                    <Route path="wallet-monitor" element={<WalletMonitor />} />
                    <Route path="trading-bot" element={<TradingBot />} />
                    <Route path="copy-trade" element={<CopyTrade />} />
                    <Route path="terminal" element={<Terminal />} />
                    <Route path=":chain/token/:tokenAddress" element={<TokenDetail />} />
                  <Route path="tgauth" element={<TelegramAuth />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
            </BrowserRouter>
              <AuthDialog />
              <PresetsSettingsModal />
            <DepositSheet />
            <Toaster richColors position="top-center" />
          </SocketIOProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Web3Provider>
  )
}

export default App
