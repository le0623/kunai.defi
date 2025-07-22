import { DataTable } from "@/components/table/data-table"
import { type ColumnDef } from "@tanstack/react-table"

type TradeActivity = {
  age: string
  type: string
  total: string
  amount: string
  price: string
  maker: string
  other: string
}

const columns: ColumnDef<TradeActivity>[] = [
  {
    header: "Age",
    accessorKey: "age",
  },
  {
    header: "Type",
    accessorKey: "type",
  },
  {
    header: "Total",
    accessorKey: "total",
  },
  {
    header: "Amount",
    accessorKey: "amount",
  },
  {
    header: "Price",
    accessorKey: "price",
  },
  {
    header: "Maker",
    accessorKey: "maker",
  },
  {
    header: "Other",
    accessorKey: "other",
  },
]

const TokenActivity = () => {
  return (
    <DataTable columns={columns} data={[]} />
  )
}

export default TokenActivity