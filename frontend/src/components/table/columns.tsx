import { type ColumnDef } from "@tanstack/react-table"

export type Token = {
  id: string
  link: string
  token: {
    symbol: string
    address: string
    logo?: string
  }
  age: number
  initial: number
  mc: number
  holders: number
  tx: {
    buys: number
    sells: number
  }
  vol: number
  price: number
  change5m: number
  change1h: number
  change6h: number
  // degenAudit: {
  //   isHoneypot: boolean
  //   isOpenSource: boolean
  // }
  // taxes: {
  //   buy: number
  //   sell: number
  // }
  buy: string
}

export const createColumns = (duration: string = '1h'): ColumnDef<Token>[] => [
  {
    accessorKey: "token",
    header: "Token",
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    accessorKey: "initial",
    header: "Liq/initial",
  },
  {
    accessorKey: "mc",
    header: "MC",
  },
  {
    accessorKey: "holders",
    header: "Holders",
  },
  {
    accessorKey: "tx",
    header: `${duration} TXs`,
  },
  {
    accessorKey: "vol",
    header: `${duration} Vol`,
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "change5m",
    header: "5m%",
  },
  {
    accessorKey: "change1h",
    header: "1h%",
  },
  {
    accessorKey: "change6h",
    header: "6h%",
  },
  // {
  //   accessorKey: "degenAudit",
  //   header: "Degen Audit",
  // },
  // {
  //   accessorKey: "taxes",
  //   header: "Taxes B/S",
  // },
  {
    accessorKey: "buy",
    header: "",
  },
]

// Default columns for backward compatibility
export const columns = createColumns()