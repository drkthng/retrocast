import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TargetStats } from "@/types";

interface DistributionChartProps {
    // We assume the distribution data comes in a usable format or we mock it for now.
    target: TargetStats;
}

export function DistributionChart({ target }: DistributionChartProps) {
    // Assuming distribution is array of counts
    // We'll map it to simple objects for Recharts
    const data = target.distribution.map((count, i) => ({
        name: `Bin ${i}`,
        count: count
    }));

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Return Distribution ({target.days_forward}d)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#f3f4f6" }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
