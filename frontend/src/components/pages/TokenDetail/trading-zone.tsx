import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { TokenInfo } from "@kunai/shared"
import { formatPrice, formatNumber } from "@/lib/utils"

export const TradingZone = ({ token }: { token: TokenInfo }) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')

  const handlePreset = (preset: 'p1' | 'p2' | 'p3') => {
    if (preset === 'p1') {
      setBuyAmount('100')
    }
  }

  return (
    <div className={`relative border-l bg-background transition-all duration-300 ${leftPanelCollapsed ? 'w-0' : 'w-96'}`}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full border bg-background p-0"
        onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
      >
        {leftPanelCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>

      {!leftPanelCollapsed && (
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-6">
          </div>
        </div>
      )}
    </div>
  )
}