"use client"

import React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Allow React components in data
  renderCell?: (value: any, row: TData, columnId: string) => React.ReactNode
  // Allow React components in headers
  renderHeader?: (header: string, columnId: string) => React.ReactNode
  // Handle row clicks
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  renderCell,
  renderHeader,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const headerContent = header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )

              return (
                <TableHead key={header.id}>
                  {renderHeader && typeof headerContent === 'string'
                    ? renderHeader(headerContent, header.id)
                    : headerContent}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            >
              {row.getVisibleCells().map((cell) => {
                const cellValue = flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )

                return (
                  <TableCell key={cell.id}>
                    {renderCell
                      ? renderCell(cell.getValue(), row.original, cell.column.id)
                      : cellValue}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}