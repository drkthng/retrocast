import { useState, useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import type {
    ColumnDef,
    SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Signal } from "@/types";
import { format } from "date-fns";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalsTableProps {
    signals: Signal[];
    onSignalClick?: (signal: Signal) => void;
    hitRateMode: "final" | "anytime";
}

export function SignalsTable({ signals, onSignalClick, hitRateMode }: SignalsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    // Dynamically generate columns based on the first signal's data
    const columns = useMemo<ColumnDef<Signal>[]>(() => {
        if (signals.length === 0) return [];

        const baseColumns: ColumnDef<Signal>[] = [
            {
                accessorKey: "date",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => format(new Date(row.getValue("date")), "MMM d, yyyy"),
            },
            {
                accessorKey: "price",
                header: "Price",
                cell: ({ row }) => {
                    const val = parseFloat(row.getValue("price"));
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
                },
            },
            // Dynamic indicator columns could go here
        ];

        // Add outcome columns for each target found in the first signal
        const firstSignal = signals[0];
        const outcomeColumns = firstSignal.outcomes.map((outcome, index) => ({
            id: `outcome_${index}`,
            header: `${outcome.days_forward}d (${outcome.direction === "ABOVE" ? "↑" : "↓"} ${outcome.threshold_pct}%)`,
            cell: ({ row }: { row: any }) => {
                const o = row.original.outcomes[index];
                if (!o) return "-";

                return (
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-medium",
                            o.actual_change_pct && o.actual_change_pct > 0 ? "text-green-500" : "text-red-500"
                        )}>
                            {o.actual_change_pct ? `${o.actual_change_pct.toFixed(2)}%` : "-"}
                        </span>
                        {(() => {
                            const isAnytime = hitRateMode === "anytime";
                            const hitValue = isAnytime ? o.anytime_hit : o.hit;
                            if (hitValue === undefined || hitValue === null) return null;
                            return (
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                                    hitValue ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {hitValue
                                        ? (isAnytime ? "ANYHIT" : "HIT")
                                        : (isAnytime ? "ANYMISS" : "MISS")}
                                </span>
                            );
                        })()}
                    </div>
                );
            }
        }));

        return [...baseColumns, ...outcomeColumns];
    }, [signals, hitRateMode]);

    const table = useReactTable({
        data: signals,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
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
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onSignalClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
