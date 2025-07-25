import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import ethereumIcon from '@/assets/icons/ethereum.svg'
import solanaIcon from '@/assets/icons/solana.svg'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSelectedChain } from '@/store/slices/otherSlice'
import { useMemo } from 'react'

// Chain configuration with icons and metadata
export const SUPPORTED_CHAINS = [
  {
    id: 'eth',
    name: 'Ethereum',
    icon: ethereumIcon,
    chainId: 1,
  },
  {
    id: 'sol',
    name: 'Solana',
    icon: solanaIcon,
    chainId: 101,
  }
]

interface ChainSelectorProps {
  className?: string
}

export function ChainSelector({ 
  className,
}: ChainSelectorProps) {
  const { selectedChain } = useAppSelector((state) => state.other)
  const dispatch = useAppDispatch()
  const selectedChainData = useMemo(() => SUPPORTED_CHAINS.find(chain => chain.id === selectedChain), [selectedChain])

  const handleChainChange = (chainId: 'eth' | 'sol') => {
    dispatch(setSelectedChain(chainId))
  }

  return (
    <Select value={selectedChain} onValueChange={handleChainChange}>
      <SelectTrigger className={cn("h-9", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <img src={selectedChainData?.icon} alt={selectedChainData?.name} className="w-4 h-4" />
            <span className="font-medium">{selectedChainData?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CHAINS.map((chain) => (
          <SelectItem key={chain.id} value={chain.id}>
            <div className="flex items-center gap-2">
              <img src={chain.icon} alt={chain.name} className="w-4 h-4" />
              <span className="font-medium">{chain.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 