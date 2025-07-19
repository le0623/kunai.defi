import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import ethereumIcon from '@/assets/icons/ethereum.svg'
import solanaIcon from '@/assets/icons/solana.svg'

// Chain configuration with icons and metadata
export const SUPPORTED_CHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: ethereumIcon,
    chainId: 1,
  },
  {
    id: 'solana',
    name: 'Solana',
    icon: solanaIcon,
    chainId: 101,
  }
]

interface ChainSelectorProps {
  selectedChain?: string
  onChainChange: (chainId: string) => void
  className?: string
  disabled?: boolean
}

export function ChainSelector({ 
  selectedChain = 'ethereum', 
  onChainChange, 
  className,
  disabled = false 
}: ChainSelectorProps) {
  const selectedChainData = SUPPORTED_CHAINS.find(chain => chain.id === selectedChain)

  return (
    <Select value={selectedChain} onValueChange={onChainChange} disabled={disabled}>
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