import { useEffect, useRef } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
    HistogramSeries,
    LineSeries
} from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";

export interface ChartIndicator {
    id: string;
    type: "Line" | "Histogram";
    data: { time: string; value: number }[];
    color: string;
    pane?: number;
}

interface ChartProps {
    data: { time: string; open: number; high: number; low: number; close: number; volume?: number }[];
    markers?: { time: string; position: "aboveBar" | "belowBar"; color: string; shape: "arrowDown" | "arrowUp"; text: string }[];
    indicators?: ChartIndicator[];
    height?: number;
}

export function PriceChart({ data, markers, indicators = [], height = 600 }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<"Line" | "Histogram">>>(new Map());

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#a1a1aa",
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            grid: {
                vertLines: { color: "rgba(42, 46, 57, 0.2)" },
                horzLines: { color: "rgba(42, 46, 57, 0.2)" },
            },
            timeScale: {
                borderColor: "rgba(42, 46, 57, 0.6)",
            },
            rightPriceScale: {
                borderColor: "rgba(42, 46, 57, 0.6)",
            },
        });

        chartRef.current = chart;

        // Main Candle Series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });
        candleSeriesRef.current = candlestickSeries;

        // Volume Series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '', // overlay
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
        volumeSeriesRef.current = volumeSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
            indicatorSeriesRefs.current.clear();
        };
    }, [height]);

    // Update Data
    useEffect(() => {
        if (!chartRef.current) return;

        if (candleSeriesRef.current && data.length > 0) {
            const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            candleSeriesRef.current.setData(sortedData as any);

            if (volumeSeriesRef.current) {
                const volumeData = sortedData.map(d => ({
                    time: d.time,
                    value: d.volume || 0,
                    color: d.close >= d.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                }));
                volumeSeriesRef.current.setData(volumeData as any);
            }

            if (markers) {
                // Cast to any to bypass strict type check for setMarkers on generic series interface
                (candleSeriesRef.current as any).setMarkers(markers as any);
            }

            // Manage Indicators
            const currentIds = new Set(indicators.map(i => i.id));
            indicatorSeriesRefs.current.forEach((series, id) => {
                if (!currentIds.has(id)) {
                    chartRef.current?.removeSeries(series);
                    indicatorSeriesRefs.current.delete(id);
                }
            });

            indicators.forEach(ind => {
                let series = indicatorSeriesRefs.current.get(ind.id);
                if (!series) {
                    if (ind.type === "Line") {
                        series = chartRef.current!.addSeries(LineSeries, {
                            color: ind.color,
                            lineWidth: 2,
                        });
                    } else {
                        series = chartRef.current!.addSeries(HistogramSeries, {
                            color: ind.color,
                        });
                    }
                    indicatorSeriesRefs.current.set(ind.id, series);
                }

                const sortedIndData = [...ind.data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
                series.setData(sortedIndData as any);
            });

            chartRef.current.timeScale().fitContent();
        }
    }, [data, markers, indicators]);

    return <div ref={chartContainerRef} className="w-full" />;
}
