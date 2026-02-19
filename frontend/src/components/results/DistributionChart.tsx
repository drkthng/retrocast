import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Label } from "recharts";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Settings2 } from "lucide-react";
import type { TargetStats } from "@/types";

// --- Binning method types and helpers ---

type BinMethod = "freedman-diaconis" | "sturges" | "scott" | "sqrt" | "fixed-width" | "fixed-count";
type YAxisMode = "count" | "percent";

const BIN_METHOD_LABELS: Record<BinMethod, string> = {
    "freedman-diaconis": "Auto (Freedman-Diaconis)",
    sturges: "Auto (Sturges)",
    scott: "Auto (Scott)",
    sqrt: "Auto (Square Root)",
    "fixed-width": "Fixed Width",
    "fixed-count": "Fixed Count",
};

function computeBinCount(data: number[], method: BinMethod, fixedWidth: number, fixedCount: number): number {
    const n = data.length;
    if (n === 0) return 1;

    const sorted = [...data].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;
    if (range === 0) return 1;

    switch (method) {
        case "sturges":
            return Math.max(1, Math.ceil(Math.log2(n) + 1));

        case "scott": {
            const mean = data.reduce((s, v) => s + v, 0) / n;
            const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
            const stdDev = Math.sqrt(variance);
            if (stdDev === 0) return 1;
            const width = 3.5 * stdDev * n ** (-1 / 3);
            return Math.max(1, Math.ceil(range / width));
        }

        case "freedman-diaconis": {
            const q1Index = Math.floor(n * 0.25);
            const q3Index = Math.floor(n * 0.75);
            const iqr = sorted[q3Index] - sorted[q1Index];
            if (iqr === 0) return Math.max(1, Math.ceil(Math.log2(n) + 1)); // fallback to Sturges
            const width = 2 * iqr * n ** (-1 / 3);
            return Math.max(1, Math.ceil(range / width));
        }

        case "sqrt":
            return Math.max(1, Math.ceil(Math.sqrt(n)));

        case "fixed-width": {
            if (fixedWidth <= 0) return 20;
            return Math.max(1, Math.ceil(range / fixedWidth));
        }

        case "fixed-count":
            return Math.max(1, Math.min(fixedCount, 200));

        default:
            return 20;
    }
}

interface DistributionChartProps {
    target: TargetStats;
    targets: TargetStats[];
    onTargetChange: (id: string) => void;
}

export function DistributionChart({ target, targets, onTargetChange }: DistributionChartProps) {
    // Binning settings (local state, persists across timeframe switches)
    const [binMethod, setBinMethod] = useState<BinMethod>("freedman-diaconis");
    const [fixedWidth, setFixedWidth] = useState(1.0);
    const [fixedCount, setFixedCount] = useState(20);
    const [yAxisMode, setYAxisMode] = useState<YAxisMode>("count");

    // Unique timeframes for the switcher
    const uniqueTargets = useMemo(() => {
        const seen = new Set();
        return targets.filter(t => {
            if (seen.has(t.days_forward)) return false;
            seen.add(t.days_forward);
            return true;
        }).sort((a, b) => a.days_forward - b.days_forward);
    }, [targets]);

    // Create histogram bins from raw distribution (returns)
    const chartData = useMemo(() => {
        if (!target.distribution || target.distribution.length === 0) return [];

        const returns = target.distribution;
        const min = Math.min(...returns);
        const max = Math.max(...returns);

        const binCount = computeBinCount(returns, binMethod, fixedWidth, fixedCount);
        const range = max - min;
        const binWidth = range / binCount || 1;

        const bins = Array.from({ length: binCount }, (_, i) => {
            const start = min + i * binWidth;
            const end = start + binWidth;
            return {
                start,
                end,
                count: 0,
                name: `${start.toFixed(1)}% to ${end.toFixed(1)}%`
            };
        });

        returns.forEach(r => {
            const binIndex = Math.min(Math.floor((r - min) / binWidth), binCount - 1);
            if (bins[binIndex]) {
                bins[binIndex].count++;
            }
        });

        // Add percentage values
        const total = returns.length;
        return bins.map(b => ({
            ...b,
            percent: total > 0 ? (b.count / total) * 100 : 0,
        }));
    }, [target.distribution, binMethod, fixedWidth, fixedCount]);

    const yDataKey = yAxisMode === "percent" ? "percent" : "count";
    const yLabel = yAxisMode === "percent" ? "Frequency (%)" : "Signals";

    return (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Return Distribution ({target.days_forward}d)</CardTitle>
                <div className="flex items-center gap-2">
                    {/* Settings Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                                title="Binning Settings"
                            >
                                <Settings2 className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="end">
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm">Histogram Settings</h4>

                                {/* Binning Method */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Binning Method
                                    </label>
                                    <Select
                                        value={binMethod}
                                        onValueChange={(val) => setBinMethod(val as BinMethod)}
                                    >
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(BIN_METHOD_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key} className="text-xs">
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Fixed Width Input */}
                                {binMethod === "fixed-width" && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Bin Width (%)
                                        </label>
                                        <Input
                                            type="number"
                                            min={0.1}
                                            step={0.5}
                                            value={fixedWidth}
                                            onChange={(e) => setFixedWidth(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}

                                {/* Fixed Count Input */}
                                {binMethod === "fixed-count" && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Number of Bins
                                        </label>
                                        <Input
                                            type="number"
                                            min={3}
                                            max={100}
                                            step={1}
                                            value={fixedCount}
                                            onChange={(e) => setFixedCount(Math.max(3, Math.min(100, parseInt(e.target.value) || 20)))}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}

                                {/* Y-Axis Mode */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Y-Axis
                                    </label>
                                    <div className="flex rounded-md border overflow-hidden">
                                        <button
                                            onClick={() => setYAxisMode("count")}
                                            className={`flex-1 text-xs py-1.5 px-3 transition-colors ${yAxisMode === "count"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-transparent text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Count
                                        </button>
                                        <button
                                            onClick={() => setYAxisMode("percent")}
                                            className={`flex-1 text-xs py-1.5 px-3 transition-colors ${yAxisMode === "percent"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-transparent text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            %
                                        </button>
                                    </div>
                                </div>

                                {/* Active bin info */}
                                <div className="text-[11px] text-muted-foreground border-t pt-2">
                                    {chartData.length} bins
                                    {chartData.length > 0 && ` · width ≈ ${(chartData[0].end - chartData[0].start).toFixed(2)}%`}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Timeframe Selector */}
                    <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
                    <Select
                        value={target.days_forward.toString()}
                        onValueChange={(val) => {
                            const found = targets.find(t => t.days_forward.toString() === val);
                            if (found) onTargetChange(found.target_id);
                        }}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueTargets.map((t) => (
                                <SelectItem key={t.target_id} value={t.days_forward.toString()}>
                                    {t.days_forward}d
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ bottom: 20, left: 10 }}>
                        <XAxis
                            dataKey="start"
                            stroke="#888888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val.toFixed(1)}%`}
                        >
                            <Label value="Return (%)" offset={-15} position="insideBottom" style={{ fill: '#888888', fontSize: '11px' }} />
                        </XAxis>
                        <YAxis
                            stroke="#888888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={yAxisMode === "percent" ? (val) => `${val.toFixed(1)}%` : undefined}
                        >
                            <Label value={yLabel} angle={-90} position="insideLeft" style={{ fill: '#888888', fontSize: '11px', textAnchor: 'middle' }} />
                        </YAxis>
                        <Tooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: '4px', color: "#f3f4f6", fontSize: '12px' }}
                            formatter={(value: any) => {
                                if (yAxisMode === "percent") {
                                    return [`${Number(value).toFixed(1)}%`, "Frequency"];
                                }
                                return [value, "Signals"];
                            }}
                            labelFormatter={(_label, payload) => {
                                if (payload && payload[0]) {
                                    return payload[0].payload.name;
                                }
                                return _label;
                            }}
                        />
                        <Bar dataKey={yDataKey} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </>
    );
}
