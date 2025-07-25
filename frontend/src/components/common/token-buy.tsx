import { Wallet2Icon } from "lucide-react"

type TokenBuyProps = {
  amount: number
  setAmount: (amount: number) => void
  selectedChain: string
}

const TokenBuy = ({ amount, setAmount, selectedChain }: TokenBuyProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted rounded p-0.5 h-6">
        <Wallet2Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Buy</span>
        <div className="flex items-center gap-1 border border-transparent hover:border-white rounded">
          <img src={`/icon/${selectedChain}.svg`} alt={selectedChain} className="w-4 h-4" />
          <input
            type="number"
            className="no-spinner text-sm h-5 w-12 p-0 border-none outline-none focus:ring-0 focus:ring-offset-0"
            onChange={(e) => setAmount(Number(e.target.value))}
            value={amount}
            min={0}
          />
        </div>
      </div>
    </div>
  )
}

export default TokenBuy