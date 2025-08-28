import { type ColumnDef } from "@tanstack/react-table"

export type Trader = {
  id: string
  wallet: string
  ethBalance: string
  oneDayPnl: string
  sevenDayPnl: string
  thirtyDayPnl: string
  sevenDayWinRate: number
  sevenDayTransactions: number
  trackedBy: number
  sevenDayTokenDistribution: string[]
  sevenDayProfit: number[]
  sevenDayAvgDuration: number
  sevenDayAvgCost: string
  lastTime: string
  rank: number
}

export const traderColumns: ColumnDef<Trader>[] = [
  {
    accessorKey: "wallet",
    header: "Wallet / ETH Bal",
    enableSorting: true,
  },
  {
    accessorKey: "oneDayPnl",
    header: "1D PnL",
    enableSorting: true,
  },
  {
    accessorKey: "sevenDayPnl",
    header: "7D PnL",
    enableSorting: true,
  },
  {
    accessorKey: "thirtyDayPnl",
    header: "30D PnL",
    enableSorting: true,
  },
  {
    accessorKey: "sevenDayWinRate",
    header: "7D Win Rate",
    enableSorting: true,
  },
  {
    accessorKey: "sevenDayTransactions",
    header: "7D TXs",
    enableSorting: true,
  },
  {
    accessorKey: "trackedBy",
    header: "Tracked/Remarked",
    enableSorting: true,
  },
  {
    accessorKey: "sevenDayTokenDistribution",
    header: "7D Token Distribution",
    enableSorting: false,
  },
  {
    accessorKey: "sevenDayProfit",
    header: "7D Profit",
    enableSorting: false,
  },
  {
    accessorKey: "sevenDayAvgDuration",
    header: "7D Avg Duration",
    enableSorting: false,
  },
  {
    accessorKey: "sevenDayAvgCost",
    header: "7D Avg Cost",
    enableSorting: false,
  },
  {
    accessorKey: "lastTime",
    header: "Last Time",
    enableSorting: true,
  },
  {
    accessorKey: "copy",
    header: "",
    enableSorting: false,
  },
] 