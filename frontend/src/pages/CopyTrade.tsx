import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { DataTable } from '@/components/table/data-table'
import { type Token } from '@/components/table/columns'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface Trader {
  id: string
  name: string
  image_url: string
}

const columnsRankTable = [
  {
    accessorKey: "wallet",
    header: "Wallet / SOL Bal",
  },
  {
    accessorKey: "1d-pnl",
    header: "1D PnL",
  },
  {
    accessorKey: "7d-pnl",
    header: "7D PnL",
  },
  {
    accessorKey: "30d-pnl",
    header: "30D PnL",
  },
  {
    accessorKey: "7d-win-rate",
    header: "7D Win Rate",
  },
  {
    accessorKey: "7d-txs",
    header: "7D TXs",
  },
  {
    accessorKey: "7d-profit",
    header: "7D Profit",
  },
  {
    accessorKey: "7d-avg-duration",
    header: "7D Avg Duration",
  },
  {
    accessorKey: "7d-avg-cost",
    header: "7D Avg Cost",
  },
  {
    accessorKey: "last-time",
    header: "Last Time",
  },
  {
    accessorKey: "copy",
    header: "",
  },
]

const columnsCopyTable = [
  {
    accessorKey: "token",
    header: "Token",
  },
]

const CopyTrade = () => {
  const navigate = useNavigate()
  const [rankorCopy, setRankorCopy] = useState<'rank' | 'copy'>('rank')
  const [traders, setTraders] = useState<Trader[]>([])

  // Handle row click
  const handleRowClick = (token: Token) => {
    if (token.link) {
      navigate(token.link);
    }
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'smart-money', label: 'Smart Money' },
    { value: 'kol-vc', label: 'KOL/VC' },
    { value: 'fresh-wallet', label: 'Fresh Wallet' },
    { value: 'sniper', label: 'Sniper' },
  ]

  const renderCell = (value: any, row: Token, columnId: string) => {
    switch (columnId) {
      case 'copy':
        return <Button size="sm"><Wallet className="w-4 h-4" /> Copy</Button>
      default:
        return <div>{value}</div>
    }
  }

  return (
    <div>
      <div className="flex gap-4 items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className={cn("font-bold cursor-pointer", rankorCopy === 'rank' ? 'text-white' : 'text-muted-foreground hover:text-white')} onClick={() => setRankorCopy('rank')}>Rank</span>
          <span className="text-muted-foreground">|</span>
          <span className={cn("font-bold cursor-pointer", rankorCopy === 'copy' ? 'text-white' : 'text-muted-foreground hover:text-white')} onClick={() => setRankorCopy('copy')}>CopyTrade</span>
        </div>
        <Sheet>
          <SheetTrigger>
            <Button size="sm">
              <Wallet className="w-4 h-4" />
              Create Copy Trade
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-4">
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="px-2">
        <DataTable
          columns={rankorCopy === 'rank' ? columnsRankTable : columnsCopyTable}
          data={[]}
          renderCell={renderCell}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}

export default CopyTrade