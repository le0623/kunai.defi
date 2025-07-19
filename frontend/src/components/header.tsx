import { Link as RouterLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.svg'
import { SearchBox } from './common/search-box'
import Button from './common/button'
import { useAuth } from '@/contexts/auth-context'
import AccountMenu from './account-menu'
import { ChainSelector } from './chain-selector'
import { useState } from 'react'

const navItems = [
  // { path: '/', label: 'Dashboard' },
  { path: '/new-pair', label: 'New Pair' },
  { path: '/wallet-monitor', label: 'Wallet Monitor' },
  // { path: '/trading-bot', label: 'Trading Bot' },
  { path: '/copy-trade', label: 'Copy Trade' },
  // { path: '/terminal', label: 'Terminal' },
]

const Header = () => {
  const location = useLocation()
  const { showAuthDlg, isAuthenticated } = useAuth()
  const [selectedChain, setSelectedChain] = useState('ethereum')

  const handleChainChange = (chainId: string) => {
    setSelectedChain(chainId)
  }

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      {/* Logo/Brand */}
      <div className="flex items-center gap-6" >
        <RouterLink to="/" className="flex items-center gap-2">
          <img src={logo} alt="KunAI" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">KUNAI</h1>
        </RouterLink>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <RouterLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium !text-white",
                  isActive
                    ? "!text-secondary"
                    : "text-muted-foreground hover:!text-secondary"
                )}
              >
                {item.label}
              </RouterLink>
            )
          })}
        </nav>
      </div>

      <SearchBox placeholder="Search pools, tokens..." />

      {/* Right side - Chain Selector and Account */}
      <div className="flex items-center gap-3">
        <ChainSelector 
          className="h-9 border-none bg-none focus:ring-0 focus:ring-offset-0"
          selectedChain={selectedChain}
          onChainChange={handleChainChange}
        />
        
        {/* Connect Wallet */}
        {isAuthenticated ? (
          <AccountMenu />
        ) : (
          <Button 
            onClick={() => showAuthDlg(true)}
          >
            Sign in
          </Button>
        )}
      </div>
    </header >
  )
}

export default Header