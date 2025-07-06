import { Link as RouterLink, useLocation } from 'react-router-dom'
import { BarChart3, Bot, Copy, Terminal, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConnectWallet } from '@/components/ConnectWallet'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/wallet-monitor', label: 'Wallet Monitor', icon: Wallet },
  { path: '/trading-bot', label: 'Trading Bot', icon: Bot },
  { path: '/copy-trading', label: 'Copy Trading', icon: Copy },
  { path: '/terminal', label: 'Terminal', icon: Terminal },
]

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Header with Navigation */}
      <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-foreground">KunAI</h1>
          
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
        
        {/* Connect Wallet */}
        <ConnectWallet />
      </header>
      
      {/* Page Content */}
      <main className="flex-1 bg-background overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default Layout 