import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PriceChart } from "./PriceChart";
import type { ChartIndicator } from "./PriceChart";
import { IndicatorSelect } from "./IndicatorSelect";
import { useChartData } from "@/hooks/useChartData";
import { useScenarios } from "@/hooks/useScenarios";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChartView() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const signalDate = searchParams.get("signal");

    const { scenario, fetchScenario } = useScenarios();
    const { ohlcv, fetchOHLCV, isLoading } = useChartData();
    const { result, fetchLastResult } = useAnalysis();

    const [indicators, setIndicators] = useState<ChartIndicator[]>([]);

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

    // Find current signal index
    const signalIndex = useMemo(() => {
        if (!result || !signalDate) return -1;
        return result.signals.findIndex(s => s.date === signalDate);
    }, [result, signalDate]);

    const markers = useMemo(() => {
        if (!result) return [];
        return result.signals.map(s => ({
            time: s.date,
            position: "aboveBar",
            color: s.date === signalDate ? "#eab308" : "#3b82f6",
            shape: "arrowDown",
            text: s.date === signalDate ? "SELECTED" : "",
        }));
    }, [result, signalDate]);

    const handleNextSignal = () => {
        if (!result || signalIndex === -1 || signalIndex >= result.signals.length - 1) return;
        const nextSignal = result.signals[signalIndex + 1];
        setSearchParams({ signal: nextSignal.date });
    };

    const handlePrevSignal = () => {
        if (!result || signalIndex <= 0) return;
        const prevSignal = result.signals[signalIndex - 1];
        setSearchParams({ signal: prevSignal.date });
    };

    const handleAddIndicator = (key: string) => {
        // Mock adding indicator for MVP
        const newIndicator: ChartIndicator = {
            id: `${key}-${Date.now()}`,
            type: "Line",
            color: "#" + Math.floor(Math.random() * 16777215).toString(16),
            data: ohlcv.map(d => ({ time: d.time, value: d.close * (1 + (Math.random() - 0.5) * 0.1) }))
        };
        setIndicators([...indicators, newIndicator]);
    };

    if (!scenario || isLoading) {
        return <div className="p-20 text-center">Loading chart data...</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <PageHeader title={`${scenario.underlying} Chart`}>
                <div className="flex items-center gap-2">
                    <IndicatorSelect onSelect={handleAddIndicator} />
                    <div className="w-px h-6 bg-border mx-2" />
                    <span className="text-sm text-muted-foreground mr-2">
                        Signal {signalIndex + 1} of {result?.signals.length || 0}
                    </span>
                    <Button variant="outline" size="icon" onClick={handlePrevSignal} disabled={signalIndex <= 0}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextSignal} disabled={!result || signalIndex >= result.signals.length - 1}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </PageHeader>

            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="flex-1 bg-card border rounded-lg overflow-hidden relative">
                    <PriceChart
                        data={ohlcv}
                        markers={markers as any}
                        indicators={indicators}
                        height={600}
                    />
                </div>
            </div>
        </div>
    );
}
