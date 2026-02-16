import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Play,
    BarChart2,
    Trash2,
    Edit,
    Database,
    Target,
    Filter
} from "lucide-react";
import type { ScenarioSummary } from "@/types";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ScenarioCardProps {
    scenario: ScenarioSummary;
    onRun: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ScenarioCard({ scenario, onRun, onDelete }: ScenarioCardProps) {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/scenarios/${scenario.id}`);
    };

    return (
        <Card
            className="cursor-pointer hover:bg-accent/5 transition-colors border-border/60 hover:border-border"
            onClick={handleCardClick}
        >
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            {scenario.name}
                            <Badge variant="outline" className="font-normal text-xs text-muted-foreground">
                                {scenario.underlying}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 min-h-[40px]">
                            {scenario.description || "No description provided."}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {scenario.data_source}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-primary" />
                        <span>{scenario.num_conditions} Conditions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span>{scenario.num_targets} Targets</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                        Updated {format(new Date(scenario.updated_at), "MMM d, yyyy")}
                    </div>
                    {scenario.last_run_hit_rate !== undefined && scenario.last_run_hit_rate !== null && (
                        <div className={cn(
                            "text-sm font-bold px-2 py-0.5 rounded",
                            scenario.last_run_hit_rate > 60 ? "bg-green-500/10 text-green-500" :
                                scenario.last_run_hit_rate < 40 ? "bg-red-500/10 text-red-500" :
                                    "bg-yellow-500/10 text-yellow-500"
                        )}>
                            {scenario.last_run_hit_rate.toFixed(1)}% Hit Rate
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex flex-wrap justify-end gap-x-2 gap-y-2 pt-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); navigate(`/scenarios/${scenario.id}`); }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e) => onRun(scenario.id, e)}>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => { e.stopPropagation(); navigate(`/scenarios/${scenario.id}/results`); }}
                    disabled={!scenario.last_run_total_signals}
                >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Results
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 p-0"
                    onClick={(e) => onDelete(scenario.id, e)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
