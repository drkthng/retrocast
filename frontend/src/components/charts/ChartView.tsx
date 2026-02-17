import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PriceChart } from "./PriceChart";
import type { ChartIndicator } from "./PriceChart";
import { IndicatorSelect } from "./IndicatorSelect";
import { useChartData } from "@/hooks/useChartData";
import { useScenarios } from "@/hooks/useScenarios";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useIndicators } from "@/hooks/useIndicators";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ChartView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const signalDate = searchParams.get('signal');
    const targetId = searchParams.get('target');

    const { scenario, fetchScenario, isLoading: isLoadingScenario, error: scenarioError } = useScenarios();
    const { result, fetchLastResult, isLoadingResult, error: analysisError } = useAnalysis();
    const { ohlcv, isLoading: isLoadingChart, error: chartError, fetchOHLCV } = useChartData();
    const { fetchIndicators, isLoading: isLoadingIndicators } = useIndicators();

    const [activeIndicatorSpecs, setActiveIndicatorSpecs] = useState<string[]>([]);
    const [indicatorData, setIndicatorData] = useState<ChartIndicator[]>([]);

    // Initial load
    useEffect(() => {
        if (id) {
            fetchScenario(id);
            fetchLastResult(id);
        }
    }, [id, fetchScenario, fetchLastResult]);

    useEffect(() => {
        if (scenario) {
            fetchOHLCV(scenario.underlying, scenario.data_source);
        }
    }, [scenario, fetchOHLCV]);

    // Fetch indicators when specs or data change
    useEffect(() => {
        if (scenario && ohlcv.length > 0 && activeIndicatorSpecs.length > 0) {
            fetchIndicators(
                scenario.underlying,
                scenario.data_source,
                activeIndicatorSpecs
            ).then(setIndicatorData);
        } else if (activeIndicatorSpecs.length === 0) {
            setIndicatorData([]);
        }
    }, [scenario, ohlcv, activeIndicatorSpecs, fetchIndicators]);


    // Find current signal index
    const signalIndex = useMemo(() => {
        if (!result || !signalDate) return -1;
        const normalizedSignalDate = signalDate.split('T')[0];
        return result.signals.findIndex(s => s.date.split('T')[0] === normalizedSignalDate);
    }, [result, signalDate]);

    const currentSignal = useMemo(() => {
        return signalIndex !== -1 ? result?.signals[signalIndex] : null;
    }, [result, signalIndex]);

    const activeTarget = useMemo(() => {
        if (!scenario || !targetId) return scenario?.targets?.[0];
        return scenario.targets.find(t => t.id === targetId) || scenario.targets[0];
    }, [scenario, targetId]);

    const markers = useMemo(() => {
        // Vertical lines are now used for Entry/Exit for better reliability
        return [];
    }, []);

    const verticalLines = useMemo(() => {
        if (!currentSignal || !activeTarget) return [];

        const lines = [
            {
                time: currentSignal.date,
                color: "#3b82f6", // blue for entry
                label: "Entry",
            }
        ];

        const outcome = currentSignal.outcomes.find(o => o.target_id === (activeTarget?.id || ''));
        if (outcome && outcome.future_date) {
            lines.push({
                time: outcome.future_date,
                color: outcome.hit ? "#22c55e" : "#ef4444",
                label: outcome.hit ? "Exit (Hit)" : "Exit (Miss)",
            });
        }

        return lines;
    }, [currentSignal, activeTarget]);

    const priceLines = useMemo(() => {
        if (!currentSignal || !activeTarget) return [];

        // Calculate target price
        let targetPrice = currentSignal.price;
        if (activeTarget.direction === "ABOVE") {
            targetPrice = currentSignal.price * (1 + activeTarget.threshold_pct / 100);
        } else {
            targetPrice = currentSignal.price * (1 - activeTarget.threshold_pct / 100);
        }

        return [
            {
                price: targetPrice,
                color: activeTarget.direction === "ABOVE" ? "#22c55e" : "#ef4444",
                lineStyle: 0, // Solid
                title: activeTarget.direction === "ABOVE" ? "Profit Target" : "Loss Target",
                lineWidth: 2 as const,
            }
        ];
    }, [currentSignal, activeTarget]);

    const handleTargetChange = (newTargetId: string) => {
        setSearchParams({ signal: signalDate || '', target: newTargetId });
    };

    const handleNextSignal = () => {
        if (!result || signalIndex === -1 || signalIndex >= result.signals.length - 1) return;
        const nextSignal = result.signals[signalIndex + 1];
        setSearchParams({ signal: nextSignal.date, target: targetId || activeTarget?.id || '' });
    };

    const handlePrevSignal = () => {
        if (!result || signalIndex <= 0) return;
        const prevSignal = result.signals[signalIndex - 1];
        setSearchParams({ signal: prevSignal.date, target: targetId || activeTarget?.id || '' });
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                handleNextSignal();
            } else if (e.key === "ArrowLeft") {
                handlePrevSignal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNextSignal, handlePrevSignal]);

    const handleAddIndicator = (spec: string) => {
        if (!activeIndicatorSpecs.includes(spec)) {
            setActiveIndicatorSpecs([...activeIndicatorSpecs, spec]);
        }
    };

    const handleRemoveIndicator = (spec: string) => {
        setActiveIndicatorSpecs(activeIndicatorSpecs.filter(s => s !== spec));
    };

    const isLoading = isLoadingScenario || isLoadingChart || isLoadingResult;
    const error = scenarioError || chartError || analysisError;

    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                <PageHeader title="Loading Chart..." />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Fetching data for chart...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !scenario) {
        return (
            <div className="h-full flex flex-col">
                <PageHeader title="Chart View" />
                <div className="flex-1 p-20 text-center text-muted-foreground bg-accent/5 m-6 rounded-lg border border-dashed">
                    {error || "Scenario not found."}
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <PageHeader title={`${scenario.underlying} Chart`}>
                <div className="flex items-center gap-2">
                    <IndicatorSelect onSelect={handleAddIndicator} />
                    <div className="w-px h-6 bg-border mx-2" />
                    {scenario.targets.length > 1 && (
                        <select
                            className="bg-background border rounded px-2 py-1 text-sm mr-2"
                            value={activeTarget?.id}
                            onChange={(e) => handleTargetChange(e.target.value)}
                        >
                            {scenario.targets.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.direction} {t.threshold_pct}% ({t.days_forward}d)
                                </option>
                            ))}
                        </select>
                    )}
                    {result && (
                        <>
                            <span className="text-sm text-muted-foreground mr-2">
                                Signal {signalIndex + 1} of {result.signals.length}
                            </span>
                            <Button variant="outline" size="icon" onClick={handlePrevSignal} disabled={signalIndex <= 0}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleNextSignal} disabled={signalIndex >= result.signals.length - 1}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                {activeIndicatorSpecs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {activeIndicatorSpecs.map(spec => (
                            <Badge key={spec} variant="secondary" className="gap-1 px-2 py-1">
                                {spec}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => handleRemoveIndicator(spec)}
                                />
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex-1 bg-card border rounded-lg overflow-hidden relative">
                    {ohlcv.length > 0 ? (
                        <PriceChart
                            data={ohlcv}
                            markers={markers}
                            indicators={indicatorData}
                            height={600}
                            focusDate={signalDate}
                            focusDaysForward={activeTarget?.days_forward}
                            priceLines={priceLines}
                            verticalLines={verticalLines}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No chart data available for this ticker.
                        </div>
                    )}
                    {isLoadingIndicators && (
                        <div className="absolute top-4 right-4 animate-pulse text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
                            Updating indicators...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
