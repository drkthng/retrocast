import { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    Label,
    Cell,
} from "recharts";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Signal, TargetStats } from "@/types";

type YMode = "final" | "max";

interface TimeResolutionChartProps {
    target: TargetStats;
    targets: TargetStats[];
    signals: Signal[];
    onTargetChange: (id: string) => void;
}

interface DataPoint {
    x: number;        // epoch ms
    y: number;        // % value
    date: string;
    price: number;
    finalPct: number | null;
    maxPct: number | null;
    hit: boolean | null;
}

function CustomDot(props: any) {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    let fill = "#6b7280";
    if (payload.hit === true) fill = "#22c55e";
    if (payload.hit === false) fill = "#ef4444";
    return (
        <circle
            cx={cx} cy={cy} r={5}
            fill={fill} fillOpacity={0.8}
            stroke={fill} strokeWidth={1}
        />
    );
}

function CustomTooltip({ active, payload, yMode }: any) {
    if (!active || !payload?.length) return null;
    const d: DataPoint = payload[0].payload;
    return (
        <div style={{
            backgroundColor: "#1f2937", borderRadius: "4px",
            color: "#f3f4f6", fontSize: "12px",
            padding: "8px 12px", lineHeight: "1.6",
        }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.date}</div>
            <div>Entry: <strong>{d.price.toFixed(2)}</strong></div>
            {d.finalPct != null && (
                <div>
                    Final:{" "}
                    <strong style={{ color: d.finalPct >= 0 ? "#22c55e" : "#ef4444" }}>
                        {d.finalPct.toFixed(2)}%
                    </strong>
                </div>
            )}
            {d.maxPct != null && (
                <div>
                    Max:{" "}
                    <strong style={{ color: d.maxPct >= 0 ? "#22c55e" : "#ef4444" }}>
                        {d.maxPct.toFixed(2)}%
                    </strong>
                </div>
            )}
            {d.hit !== null && (
                <div>
                    Result:{" "}
                    <strong style={{ color: d.hit ? "#22c55e" : "#ef4444" }}>
                        {d.hit ? "✓ Hit" : "✗ Miss"}
                    </strong>
                </div>
            )}
        </div>
    );
}

export function TimeResolutionChart({
    target, targets, signals, onTargetChange,
}: TimeResolutionChartProps) {
    const [yMode, setYMode] = useState<YMode>("final");

    const uniqueTargets = useMemo(() => {
        const seen = new Set<number>();
        return targets
            .filter(t => { if (seen.has(t.days_forward)) return false; seen.add(t.days_forward); return true; })
            .sort((a, b) => a.days_forward - b.days_forward);
    }, [targets]);

    const chartData = useMemo<DataPoint[]>(() => {
        return signals
            .map(sig => {
                const outcome = sig.outcomes.find(o => o.target_id === target.target_id);
                if (!outcome) return null;
                const finalPct = outcome.actual_change_pct ?? null;
                const maxPct = outcome.max_change_pct ?? null;
                const y = (yMode === "max" ? maxPct : finalPct) ?? 0;
                return {
                    x: new Date(sig.date).getTime(),
                    y,
                    date: sig.date,
                    price: sig.price,
                    finalPct,
                    maxPct,
                    hit: outcome.hit ?? null,
                } as DataPoint;
            })
            .filter((d): d is DataPoint => d !== null)
            .sort((a, b) => a.x - b.x);
    }, [signals, target.target_id, yMode]);

    const formatDate = (ms: number) =>
        new Date(ms).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const thresholdLine = target.direction === "ABOVE"
        ? target.threshold_pct
        : -target.threshold_pct;

    // For "max" mode with BELOW targets the threshold line should be inverted
    const effectiveThreshold = yMode === "max" && target.direction === "BELOW"
        ? -Math.abs(thresholdLine)
        : thresholdLine;

    const yLabel = yMode === "max"
        ? (target.direction === "ABOVE" ? "Max High %" : "Max Low %")
        : "Final Return (%)";

    return (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Time Resolution ({target.days_forward}d)</CardTitle>
                <div className="flex items-center gap-2">
                    {/* Y-axis mode toggle */}
                    <div className="flex rounded-md border overflow-hidden text-xs">
                        <button
                            onClick={() => setYMode("final")}
                            className={`px-2.5 py-1 transition-colors ${yMode === "final"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Final %
                        </button>
                        <button
                            onClick={() => setYMode("max")}
                            className={`px-2.5 py-1 transition-colors ${yMode === "max"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Max %
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />Hit
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />Miss
                        </span>
                    </div>

                    {/* Timeframe selector */}
                    <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
                    <Select
                        value={target.days_forward.toString()}
                        onValueChange={val => {
                            const found = targets.find(t => t.days_forward.toString() === val);
                            if (found) onTargetChange(found.target_id);
                        }}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueTargets.map(t => (
                                <SelectItem key={t.target_id} value={t.days_forward.toString()}>
                                    {t.days_forward}d
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="h-[320px] pt-4">
                {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No evaluable signals for this target.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ bottom: 24, left: 10, right: 16, top: 8 }}>
                            <XAxis
                                dataKey="x"
                                type="number"
                                scale="time"
                                domain={["auto", "auto"]}
                                tickFormatter={formatDate}
                                stroke="#888888"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickCount={6}
                            >
                                <Label
                                    value="Signal Date"
                                    offset={-14}
                                    position="insideBottom"
                                    style={{ fill: "#888888", fontSize: "11px" }}
                                />
                            </XAxis>
                            <YAxis
                                dataKey="y"
                                stroke="#888888"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={v => `${v.toFixed(1)}%`}
                            >
                                <Label
                                    value={yLabel}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ fill: "#888888", fontSize: "11px", textAnchor: "middle" }}
                                />
                            </YAxis>
                            <Tooltip content={<CustomTooltip yMode={yMode} />} />

                            {/* Zero line */}
                            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1} />

                            {/* Threshold line */}
                            <ReferenceLine
                                y={effectiveThreshold}
                                stroke="#3b82f6"
                                strokeDasharray="3 6"
                                strokeWidth={1}
                                label={{
                                    value: `${effectiveThreshold > 0 ? "+" : ""}${effectiveThreshold}% target`,
                                    position: "insideTopRight",
                                    fill: "#3b82f6",
                                    fontSize: 10,
                                }}
                            />

                            <Scatter data={chartData} shape={<CustomDot />}>
                                {chartData.map((_, i) => <Cell key={i} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </>
    );
}
