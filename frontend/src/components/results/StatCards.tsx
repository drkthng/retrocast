import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult } from "@/types";
import { Activity, Percent, Target } from "lucide-react";
import { format } from "date-fns";

interface StatCardsProps {
    result: AnalysisResult;
}

export function StatCards({ result }: StatCardsProps) {
    // Calculate some aggregate stats
    const bestHitRate = Math.max(...result.target_stats.map(t => t.hit_rate_pct));
    const avgHitRate = result.target_stats.reduce((acc, t) => acc + t.hit_rate_pct, 0) / (result.target_stats.length || 1);
    const totalSignals = result.total_signals;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Signals
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSignals}</div>
                    <p className="text-xs text-muted-foreground">
                        {result.total_bars.toLocaleString()} data points analyzed
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Avg Hit Rate
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{avgHitRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                        Across {result.target_stats.length} target profiles
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Best Hit Rate
                    </CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">{bestHitRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                        Best performing target config
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Data Range
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-sm font-bold truncate">
                        {format(new Date(result.data_start), "MMM yyyy")} - {format(new Date(result.data_end), "MMM yyyy")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Last run: {format(new Date(result.run_date), "MMM d, HH:mm")}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
