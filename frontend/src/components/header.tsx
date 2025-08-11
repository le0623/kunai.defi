import { Link as RouterLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.svg'
import { SearchBox } from './common/search-box'
import { Button } from '@/components/ui/button'
import { useAuth, useAppDispatch } from '@/store/hooks'
import AccountMenu from './account-menu'
import { ChainSelector } from './chain-selector'
import { setIsDepositSheetOpen } from '@/store/slices/uiSlice'
import { useAccount } from 'wagmi'

const navItems = [
  // { path: '/', label: 'Dashboard' },
  { path: '/new-pair', label: 'New Pair' },
  { path: '/', label: 'Trending' },
  { path: '/wallet-monitor', label: 'Wallet Monitor' },
  // { path: '/trading-bot', label: 'Trading Bot' },
  { path: '/copy-trade', label: 'Copy Trade' },
]

const Header = () => {
  const location = useLocation()
  const { showAuthDlg, isAuthenticated } = useAuth()
  const { isConnected } = useAccount()
  const dispatch = useAppDispatch()

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
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white hover:bg-muted"
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
        />

        {/* Connect Wallet */}
        {isAuthenticated || isConnected ? (
          <>
            {isAuthenticated && <Button onClick={() => dispatch(setIsDepositSheetOpen(true))}>Deposit</Button>}
            <AccountMenu />
          </>
        ) : (
          <Button
            variant="primary"
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