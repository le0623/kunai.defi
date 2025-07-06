import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Web3Provider from '@/components/web3-provider'
import Layout from '@/components/layout/Layout'
import WebAppLayout from '@/components/layout/WebAppLayout'
import Dashboard from '@/pages/Dashboard'
import WalletMonitor from '@/pages/WalletMonitor'
import TradingBot from '@/pages/TradingBot'
import CopyTrading from '@/pages/CopyTrading'
import Terminal from '@/pages/Terminal'
import TelegramWebApp from '@/pages/TelegramWebApp'
import ProxyWalletCreate from './components/telegram/ProxyWalletCreate'

const queryClient = new QueryClient()

function App() {
  return (
    <Web3Provider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/webapp/*" element={
              <WebAppLayout>
                <Routes>
                  <Route path="/" element={<TelegramWebApp />} />
                  <Route path="/deploy-wallet" element={<ProxyWalletCreate />} />
                </Routes>
              </WebAppLayout>
            } />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/wallet-monitor" element={<WalletMonitor />} />
                  <Route path="/trading-bot" element={<TradingBot />} />
                  <Route path="/copy-trading" element={<CopyTrading />} />
                  <Route path="/terminal" element={<Terminal />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Router>
      </QueryClientProvider>
    </Web3Provider>
  )
}

export default App
