import { Link as RouterLink, useLocation } from 'react-router-dom'
import { BarChart3, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.svg'
import { SearchBox } from './common/search-box'
import Button from './common/button'
import { useAuth } from '@/contexts/auth-context'
import AccountMenu from './account-menu'

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  // { path: '/wallet-monitor', label: 'Wallet Monitor', icon: Wallet },
  // { path: '/trading-bot', label: 'Trading Bot', icon: Bot },
  // { path: '/copy-trading', label: 'Copy Trading', icon: Copy },
  // { path: '/terminal', label: 'Terminal', icon: Terminal },
  { path: '/new-pair', label: 'New Pair', icon: Network },
]

const Header = () => {
  const location = useLocation()
  const { showAuthDlg, isAuthenticated } = useAuth()

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      {/* Logo/Brand */}
      <div className="flex items-center gap-6" >
        <div className="flex items-center gap-2">
          <img src={logo} alt="KunAI" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">KUNAI</h1>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <RouterLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </RouterLink>
            )
          })}
        </nav>
      </div>

      <SearchBox placeholder="Search pools, tokens..." />

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
    </header >
  )
}

export default Header