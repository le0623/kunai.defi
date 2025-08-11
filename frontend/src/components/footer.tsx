import { cn } from '@/lib/utils'
import { usePrice } from '@/store/hooks'
import { Separator } from '@radix-ui/react-separator'
import { Wallet, Eye, TrendingUp, Activity, DollarSign, Shield, BookOpen, Info, Bot, Code, Users, Trophy, Smartphone } from 'lucide-react'

const FooterItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer hover:bg-accent/50 rounded-sm px-2 py-1">
      {icon}
      <span>{label}</span>
    </div>
  )
}

const Footer = () => {
  const { marketPrice, selectedChain } = usePrice()

  return (
    <footer className="h-9 border-t border-border bg-background-secondary p-2 flex items-center justify-between">
      {/* Left Section - Trading Tools */}
      <div className="flex items-center gap-1">
        <FooterItem icon={<Wallet className="w-3 h-3" />} label="Wallet Tracker" />
        <FooterItem icon={<DollarSign className="w-3 h-3" />} label="Holding" />
        <FooterItem icon={<Eye className="w-3 h-3" />} label="Watchlist" />
        <FooterItem icon={<TrendingUp className="w-3 h-3" />} label="Trending" />
        <FooterItem icon={<Activity className="w-3 h-3" />} label="Tracker" />
        <FooterItem icon={<DollarSign className="w-3 h-3" />} label="PnL" />
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
        <FooterItem icon={<Shield className="w-3 h-3" />} label="Stable" />
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