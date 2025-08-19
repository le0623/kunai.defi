import { cn } from '@/lib/utils'
import { usePrice } from '@/hooks'
import { Separator } from '@radix-ui/react-separator'
import { Wallet, Eye, TrendingUp, Activity, DollarSign, Shield, BookOpen, Info, Bot, Code, Users, Trophy, Smartphone } from 'lucide-react'
import { SocketIOStatus } from './SocketIOStatus'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { togglePanel } from '@/store/slices/uiSlice'
import { usePanelPosition } from '@/hooks/usePanelPosition'
import { useRef } from 'react'

interface FooterItemProps {
  icon: React.ReactNode
  label: string
  panelId?: string
  onClick?: () => void
}

const FooterItem: React.FC<FooterItemProps> = ({ icon, label, panelId, onClick }) => {
  const dispatch = useDispatch()
  const panelState = useSelector((state: RootState) => 
    panelId ? state.ui.panels[panelId] : null
  )
  const itemRef = useRef<HTMLDivElement>(null)
  const { calculatePanelPosition } = usePanelPosition()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (panelId) {
      const position = calculatePanelPosition(itemRef.current!)
      dispatch(togglePanel({ panelId, position }))
    }
  }

  return (
    <div 
      ref={itemRef}
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer hover:bg-accent/50 rounded-sm px-2 py-1 transition-colors",
        panelState?.isOpen && "text-foreground bg-accent/50"
      )}
      onClick={handleClick}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}

const Footer = () => {
  const { marketPrice, selectedChain } = usePrice()
  const { footerRef } = usePanelPosition()

  return (
    <footer ref={footerRef} className="h-9 border-t border-border bg-background-secondary p-2 flex items-center justify-between">
      {/* Left Section - Trading Tools */}
      <div className="flex items-center gap-1">
        <FooterItem 
          icon={<Wallet className="w-3 h-3" />} 
          label="Wallet Tracker" 
          panelId="wallet-tracker"
        />
        <FooterItem 
          icon={<DollarSign className="w-3 h-3" />} 
          label="Holding" 
          panelId="holding"
        />
        <FooterItem 
          icon={<Eye className="w-3 h-3" />} 
          label="Watchlist" 
          panelId="watchlist"
        />
        <FooterItem 
          icon={<TrendingUp className="w-3 h-3" />} 
          label="Trending" 
          panelId="trending"
        />
        <FooterItem 
          icon={<Activity className="w-3 h-3" />} 
          label="Tracker" 
          panelId="tracker"
        />
        <FooterItem 
          icon={<DollarSign className="w-3 h-3" />} 
          label="PnL" 
          panelId="pnl"
        />
        <Separator orientation="vertical" className="text-muted-foreground" />
        <div className="flex items-center gap-1">
          { selectedChain === 'eth' ? 
            <img src="/icon/eth.svg" className="w-4 h-4" />
            :
            <img src="/icon/sol.svg" className="w-4 h-4" />
          }
          <span className={cn("text-xs", selectedChain === 'eth' ? 'text-blue-300' : 'text-purple-600')}>
            ${parseFloat(marketPrice || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
        
      {/* Right Section - App & Resources */}
      <div className="flex items-center gap-1">
        <SocketIOStatus />
        <FooterItem icon={<BookOpen className="w-3 h-3" />} label="Tutorial" />
        <FooterItem icon={<Info className="w-3 h-3" />} label="About" />
        <FooterItem icon={<Bot className="w-3 h-3" />} label="Bot" />
        <FooterItem icon={<Code className="w-3 h-3" />} label="API" />
        <FooterItem icon={<Users className="w-3 h-3" />} label="Refer" />
        <FooterItem icon={<Trophy className="w-3 h-3" />} label="Contest" />
        <FooterItem icon={<Smartphone className="w-3 h-3" />} label="APP" />
      </div>
    </footer>
  )
}

export default Footer