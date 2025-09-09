import * as React from "react"
import { Table as HeroUITable, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<typeof HeroUITable>>(
  ({ className, ...props }, ref) => (
    <HeroUITable ref={ref} className={cn(className)} {...props} />
  ),
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof TableHeader>>(
  ({ className, ...props }, ref) => (
    <TableHeader ref={ref} className={cn(className)} {...props} />
  ),
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof TableBody>>(
  ({ className, ...props }, ref) => (
    <TableBody ref={ref} className={cn(className)} {...props} />
  ),
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<typeof TableRow>>(
  ({ className, ...props }, ref) => (
    <TableRow ref={ref} className={cn(className)} {...props} />
  ),
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentProps<typeof TableColumn>>(
  ({ className, ...props }, ref) => (
    <TableColumn ref={ref} className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentProps<typeof TableCell>>(
  ({ className, ...props }, ref) => (
    <TableCell ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
)
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}