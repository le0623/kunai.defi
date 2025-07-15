import { type ColumnDef } from "@tanstack/react-table"

export type Token = {
  id: string
  token: string
  age: string
  initial: string
  mc: string
  holders: number
  tx1m: number
  vol1m: string
  price: string
  change1m: number
  change5m: number
  change1h: number
  degenAudit: string
  taxesBuy: number
  taxesSell: number
  dev: string
}

export const columns: ColumnDef<Token>[] = [
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
    accessorKey: "tx1m",
    header: "1m TXs",
  },
  {
    accessorKey: "vol1m",
    header: "1m Vol",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "change1m",
    header: "1m%",
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
    accessorKey: "degenAudit",
    header: "Degen Audit",
  },
  {
    accessorKey: "taxes",
    header: "Taxes B/S",
  },
]