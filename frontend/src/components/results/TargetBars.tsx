import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TargetStats } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TargetBarsProps {
    stats: TargetStats[];
    onTargetClick?: (targetId: string) => void;
}

export function TargetBars({ stats, onTargetClick }: TargetBarsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Target Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {stats.map((target) => (
                    <div
                        key={target.target_id}
                        className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                        onClick={() => onTargetClick?.(target.target_id)}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 font-medium">
                                <span>{target.days_forward}d</span>
                                {target.direction === "ABOVE" ? <ArrowUp className="w-3 h-3 text-green-500" /> : <ArrowDown className="w-3 h-3 text-red-500" />}
                                <span>{target.threshold_pct}%</span>
                            </div>
                            <div className="font-bold">
                                <span className={cn(
                                    target.hit_rate_pct > 60 ? "text-green-500" :
                                        target.hit_rate_pct < 40 ? "text-red-500" : "text-yellow-500"
                                )}>
                                    {target.hit_rate_pct.toFixed(1)}%
                                </span>
                                <span className="text-muted-foreground ml-2 font-normal text-xs">
                                    ({target.hit_count}/{target.total_evaluable})
                                </span>
                            </div>
                        </div>

                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all",
                                    target.hit_rate_pct > 60 ? "bg-green-500" :
                                        target.hit_rate_pct < 40 ? "bg-red-500" : "bg-yellow-500"
                                )}
                                style={{ width: `${target.hit_rate_pct}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
