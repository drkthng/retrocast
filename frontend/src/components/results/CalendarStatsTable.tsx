import { useMemo } from "react";
import type { Signal } from "@/types";

interface CalendarStatsTableProps {
    signals: Signal[];
    targetId: string | null;
    hitRateMode: "final" | "anytime";
}

interface StatRow {
    label: string;
    count: number;
    hits: number;
    rate: number;
}

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getRateColor(rate: number): string {
    if (rate >= 60) return "text-emerald-400";
    if (rate >= 40) return "text-amber-400";
    return "text-rose-400";
}

function getRateBarColor(rate: number): string {
    if (rate >= 60) return "bg-emerald-500/20";
    if (rate >= 40) return "bg-amber-500/20";
    return "bg-rose-500/20";
}

function StatsTable({ title, rows }: { title: string; rows: StatRow[] }) {
    const total = rows.reduce((acc, r) => ({ count: acc.count + r.count, hits: acc.hits + r.hits }), { count: 0, hits: 0 });
    const avgRate = total.count > 0 ? (total.hits / total.count) * 100 : 0;

    return (
        <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h4>
            <div className="rounded-lg border border-border/50 overflow-hidden text-sm">
                {/* Header */}
                <div className="grid grid-cols-4 bg-gradient-to-r from-primary/15 to-primary/5 border-b border-border/50 px-3 py-2">
                    <span className="font-semibold text-foreground/80 text-xs">Period</span>
                    <span className="font-semibold text-foreground/80 text-xs text-right">Signals</span>
                    <span className="font-semibold text-foreground/80 text-xs text-right">Hits</span>
                    <span className="font-semibold text-foreground/80 text-xs text-right">Rate</span>
                </div>

                {/* Data rows */}
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="relative grid grid-cols-4 px-3 py-1.5 items-center odd:bg-card even:bg-accent/10"
                    >
                        {/* progress bar background */}
                        <div
                            className={`absolute inset-y-0 right-0 ${getRateBarColor(row.rate)} transition-all duration-500`}
                            style={{ width: `${row.rate}%` }}
                        />
                        <span className="relative z-10 text-xs text-foreground/70">{row.label}</span>
                        <span className="relative z-10 text-xs text-right text-foreground/70">{row.count}</span>
                        <span className="relative z-10 text-xs text-right text-foreground/70">{row.hits}</span>
                        <span className={`relative z-10 text-xs text-right font-semibold ${getRateColor(row.rate)}`}>
                            {row.rate.toFixed(1)}%
                        </span>
                    </div>
                ))}

                {/* Average footer row */}
                {rows.length > 0 && (
                    <div className="relative grid grid-cols-4 px-3 py-2 items-center border-t border-border/50 bg-muted/20">
                        <div
                            className={`absolute inset-y-0 right-0 ${getRateBarColor(avgRate)} opacity-60 transition-all duration-500`}
                            style={{ width: `${avgRate}%` }}
                        />
                        <span className="relative z-10 text-xs font-semibold text-foreground/90">Avg</span>
                        <span className="relative z-10 text-xs text-right font-semibold text-foreground/90">{total.count}</span>
                        <span className="relative z-10 text-xs text-right font-semibold text-foreground/90">{total.hits}</span>
                        <span className={`relative z-10 text-xs text-right font-bold ${getRateColor(avgRate)}`}>
                            {avgRate.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function CalendarStatsTable({ signals, targetId, hitRateMode }: CalendarStatsTableProps) {
    const { monthlyRows, yearlyRows } = useMemo(() => {
        if (!targetId || signals.length === 0) return { monthlyRows: [], yearlyRows: [] };

        const monthMap = new Map<string, { count: number; hits: number }>();
        const yearMap = new Map<string, { count: number; hits: number }>();

        for (const signal of signals) {
            const outcome = signal.outcomes.find(o => o.target_id === targetId);
            if (!outcome) continue;

            const [yearStr, monthStr] = signal.date.split("-");
            const year = yearStr;
            const monthIdx = parseInt(monthStr, 10) - 1;
            const monthLabel = `${MONTH_NAMES[monthIdx]} ${year}`;

            const hit = hitRateMode === "anytime" ? outcome.anytime_hit === true : outcome.hit === true;

            // month
            const mEntry = monthMap.get(monthLabel) ?? { count: 0, hits: 0 };
            mEntry.count += 1;
            if (hit) mEntry.hits += 1;
            monthMap.set(monthLabel, mEntry);

            // year
            const yEntry = yearMap.get(year) ?? { count: 0, hits: 0 };
            yEntry.count += 1;
            if (hit) yEntry.hits += 1;
            yearMap.set(year, yEntry);
        }

        const toRows = (map: Map<string, { count: number; hits: number }>, sortFn: (a: [string, any], b: [string, any]) => number): StatRow[] =>
            Array.from(map.entries())
                .sort(sortFn)
                .map(([label, { count, hits }]) => ({
                    label,
                    count,
                    hits,
                    rate: count > 0 ? (hits / count) * 100 : 0,
                }));

        // Sort months chronologically: newest first
        const sortMonths = (a: [string, any], b: [string, any]) => {
            // Label is "Jan 2024"
            const [m1, y1] = a[0].split(" ");
            const [m2, y2] = b[0].split(" ");
            if (y1 !== y2) return y2.localeCompare(y1);
            return MONTH_NAMES.indexOf(m2) - MONTH_NAMES.indexOf(m1);
        };

        const sortYears = (a: [string, any], b: [string, any]) => b[0].localeCompare(a[0]);

        return {
            monthlyRows: toRows(monthMap, sortMonths),
            yearlyRows: toRows(yearMap, sortYears)
        };
    }, [signals, targetId, hitRateMode]);

    if (!targetId) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a target to view statistics.
            </div>
        );
    }

    if (monthlyRows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No signal data available for this target.
            </div>
        );
    }

    return (
        <div className="p-4 overflow-auto h-full animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
                <StatsTable title="By Month" rows={monthlyRows} />
                <StatsTable title="By Year" rows={yearlyRows} />
            </div>
        </div>
    );
}
