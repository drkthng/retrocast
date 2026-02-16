import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TargetStats } from "@/types";

interface DistributionChartProps {
    target: TargetStats;
    targets: TargetStats[];
    onTargetChange: (id: string) => void;
}

export function DistributionChart({ target, targets, onTargetChange }: DistributionChartProps) {
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

        // Use ~20 bins
        const binCount = 20;
        const range = max - min;
        const binWidth = range / binCount || 1; // Fallback if all returns are same

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

        return bins;
    }, [target.distribution]);

    return (
        <Card className="h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Return Distribution ({target.days_forward}d)</CardTitle>
                <div className="flex items-center gap-2">
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
                        >
                            <Label value="Signals" angle={-90} position="insideLeft" style={{ fill: '#888888', fontSize: '11px', textAnchor: 'middle' }} />
                        </YAxis>
                        <Tooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: '4px', color: "#f3f4f6", fontSize: '12px' }}
                            formatter={(value: any) => [value, "Signals"]}
                            labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                    return payload[0].payload.name;
                                }
                                return label;
                            }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
