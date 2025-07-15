import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  Wallet,
  Users,
  Trophy,
  LogOut,
} from 'lucide-react'
import CopyIcon from './common/copy'
import { useAccount, useBalance } from 'wagmi'
import { shortenAddress } from '@/lib/utils'

const AccountMenu = () => {
  const { logout } = useAuth()
  const { address: walletAddress } = useAccount()
  const { data: balance } = useBalance({
    address: walletAddress,
    chainId: 1,
  })

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 px-2 py-1 h-auto cursor-pointer bg-accent rounded-md">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-medium">
            {walletAddress?.slice(2, 4).toUpperCase()}
          </div>

          {/* Wallet Info */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <img src="/ethereum.svg" alt="ETH" width={16} height={16} className="w-4 h-4" />
              <span className="text-sm font-medium">{balance?.value}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{shortenAddress(walletAddress || '')}</span>
              <CopyIcon clipboardText={walletAddress} />
            </div>
          </div>

          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Menu Items */}
        <DropdownMenuItem className="flex items-center gap-3 cursor-pointer">
          <Wallet className="h-4 w-4" />
          <span>My Wallet</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-3 cursor-pointer">
          <Users className="h-4 w-4" />
          <span>Referrals</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-3 cursor-pointer">
          <Trophy className="h-4 w-4" />
          <span>Contests</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-3 cursor-pointer text-red-600 focus:text-red-600"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AccountMenu