import Presets from "@/components/common/presets"
import Input from "@/components/common/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export const Trade = () => {
  const [isBuy, setIsBuy] = useState(true)
  const [amount, setAmount] = useState(0.01)

  const handleBuy = () => {
    console.log('buy')
  }

  const handleSell = () => {
    console.log('sell')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 p-0.5 bg-muted rounded-sm">
        <div className={`bg-transparent rounded-sm p-0.5 flex-1 cursor-pointer text-center ${isBuy ? 'text-green-500 bg-white/10' : 'text-white/50'}`} onClick={() => setIsBuy(true)}>
          Buy
        </div>
        <div className={`bg-transparent rounded-sm p-0.5 flex-1 cursor-pointer text-center ${!isBuy ? 'text-red-500 bg-white/10' : 'text-white/50'}`} onClick={() => setIsBuy(false)}> 
          Sell
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm text-white/50">
        <Presets />
          <div className="flex items-center gap-2">
            <span className="text-white/50">Balance:</span>
            <span className="text-white">0 ETH</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col bg-muted rounded-sm">
          <Input
            className="border-inherit w-full"
            prefixComp={<span className="text-white/50 px-2">Amount</span>}
            suffixComp={<span className="text-white/50 px-2">ETH</span>}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            type="number"
          />
          <div className="flex items-center border-t">
            {[0.01, 0.05, 0.1, 0.2].map((p, index) => (
              <div className={`flex items-center gap-2 cursor-pointer flex-1 justify-center border-r last:border-r-0 py-1 text-sm text-white/50 hover:bg-white/10`} key={index} onClick={() => setAmount(p)} >
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-start text-sm text-white/50">
          1 ETH ≈ $1,000
        </div>
      </div>
      <Button disabled={!amount}>
        {isBuy ? 'Buy' : 'Sell'}
      </Button>
    </div>
  )
}