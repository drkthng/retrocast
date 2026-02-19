import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAnalysis } from "@/hooks/useAnalysis";
import { StatCards } from "./StatCards";
import { TargetBars } from "./TargetBars";
import { DistributionChart } from "./DistributionChart";
import { TimeResolutionChart } from "./TimeResolutionChart";
import { SignalsTable } from "./SignalsTable";
import { CalendarStatsTable } from "./CalendarStatsTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { exportApi } from "@/services/api";

type ChartTab = "distribution" | "time" | "statistics";

export default function ResultsDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchLastResult, result, isLoadingResult, error } = useAnalysis();
    const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
    const [activeChartTab, setActiveChartTab] = useState<ChartTab>("distribution");
    type HitRateMode = "final" | "anytime";
    const [hitRateMode, setHitRateMode] = useState<HitRateMode>("final");

    useEffect(() => {
        if (id) {
            fetchLastResult(id);
        }
    }, [id, fetchLastResult]);

    useEffect(() => {
        // Set default active target when result loads
        if (result && result.target_stats.length > 0 && !activeTargetId) {
            setActiveTargetId(result.target_stats[0].target_id);
        }
    }, [result, activeTargetId]);

    const handleExportCSV = async () => {
        if (!id) return;
        try {
            const response = await exportApi.csv(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `scenario_${id}_results.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (e) {
            console.error("Export failed", e);
        }
    };

    if (isLoadingResult) {
        return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />Loading results...</div>;
    }

    if (error || !result) {
        return (
            <div className="h-full flex flex-col">
                <PageHeader title="Analysis Results" />
                <div className="p-20 text-center text-muted-foreground bg-accent/5 m-6 rounded-lg border border-dashed">
                    {error || "No results found. Run analysis first."}
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => navigate("/")}>Go to Dashboard</Button>
                    </div>
                </div>
            </div>
        );
    }

    const activeTargetStats = result.target_stats.find(t => t.target_id === activeTargetId);

    return (
        <div className="h-full flex flex-col">
            <PageHeader title={`Results: ${result.scenario_name}`}>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
                <div className="flex rounded-md border overflow-hidden text-xs ml-2">
                    <button
                        onClick={() => setHitRateMode("final")}
                        className={`px-2.5 py-1 transition-colors ${hitRateMode === "final"
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Final Hit
                    </button>
                    <button
                        onClick={() => setHitRateMode("anytime")}
                        className={`px-2.5 py-1 transition-colors ${hitRateMode === "anytime"
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Anytime Hit
                    </button>
                </div>
            </PageHeader>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Top Stats */}
                <div className="max-w-7xl mx-auto space-y-6">
                    <StatCards result={result} hitRateMode={hitRateMode} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Target Bars */}
                        <div className="lg:col-span-1">
                            <TargetBars
                                stats={result.target_stats}
                                onTargetClick={setActiveTargetId}
                                hitRateMode={hitRateMode}
                            />
                        </div>

                        {/* Right: Chart Panel with Tabs */}
                        <div className="lg:col-span-2">
                            {activeTargetStats ? (
                                <Card className="h-[400px] overflow-hidden">
                                    {/* Tab strip */}
                                    <div className="flex items-center gap-1 px-4 pt-3 border-b border-border/50">
                                        <button
                                            onClick={() => setActiveChartTab("distribution")}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${activeChartTab === "distribution"
                                                ? "bg-primary/10 text-primary border-b-2 border-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Distribution
                                        </button>
                                        <button
                                            onClick={() => setActiveChartTab("time")}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${activeChartTab === "time"
                                                ? "bg-primary/10 text-primary border-b-2 border-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Time Resolution
                                        </button>
                                        <button
                                            onClick={() => setActiveChartTab("statistics")}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${activeChartTab === "statistics"
                                                ? "bg-primary/10 text-primary border-b-2 border-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Statistics
                                        </button>
                                    </div>

                                    {/* Chart content */}
                                    {activeChartTab === "distribution" ? (
                                        <DistributionChart
                                            target={activeTargetStats}
                                            targets={result.target_stats}
                                            onTargetChange={setActiveTargetId}
                                        />
                                    ) : activeChartTab === "time" ? (
                                        <TimeResolutionChart
                                            target={activeTargetStats}
                                            targets={result.target_stats}
                                            signals={result.signals}
                                            onTargetChange={setActiveTargetId}
                                        />
                                    ) : (
                                        <CalendarStatsTable
                                            signals={result.signals}
                                            targetId={activeTargetId}
                                            hitRateMode={hitRateMode}
                                        />
                                    )}
                                </Card>
                            ) : (
                                <div className="h-[400px] flex items-center justify-center border rounded bg-card text-muted-foreground">
                                    Select a target to view distribution
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom: Signals Table */}
                    <div className="bg-card rounded-lg border shadow-sm p-4">
                        <h3 className="tex-lg font-semibold mb-4">Signal History</h3>
                        <SignalsTable
                            signals={result.signals}
                            hitRateMode={hitRateMode}
                            onSignalClick={(signal) => {
                                // Navigate to chart view with query param specific to this signal date
                                navigate(`/scenarios/${id}/chart?signal=${signal.date}${activeTargetId ? `&target=${activeTargetId}` : ''}`);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
