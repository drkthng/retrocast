import { useEffect, useRef, useState, useCallback } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
} from "lightweight-charts";
import type { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";

export interface ChartIndicator {
    id: string;
    type: "Line" | "Histogram";
    data: { time: string; value: number }[];
    color: string;
    pane?: number;
}

interface ChartProps {
    data: { time: string; open: number; high: number; low: number; close: number; volume?: number }[];
    markers?: { time: string; position: "aboveBar" | "belowBar"; color: string; shape: "arrowDown" | "arrowUp" | "circle"; text: string; size?: number }[];
    indicators?: ChartIndicator[];
    height?: number;
    focusDate?: string | null;
    focusDaysForward?: number;
    priceLines?: { price: number; color: string; lineStyle?: number; lineWidth?: 1 | 2 | 3 | 4; title?: string }[];
    verticalLines?: { time: string; color: string; label?: string }[];
}

export function PriceChart({ data, markers, indicators = [], height = 600, focusDate, focusDaysForward, priceLines = [], verticalLines = [] }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartApi, setChartApi] = useState<IChartApi | null>(null);
    const [candleSeries, setCandleSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
    const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<"Histogram"> | null>(null);

    const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<"Line" | "Histogram">>>(new Map());
    const priceLineRefs = useRef<any[]>([]);
    const vLineDivRefs = useRef<HTMLDivElement[]>([]);

    const toTimestamp = (dateStr: string) => Math.floor(new Date(dateStr).getTime() / 1000);

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
                vertLines: { visible: false },
                horzLines: { color: "rgba(42, 46, 57, 0.1)" },
            },
            timeScale: {
                borderColor: "rgba(42, 46, 57, 0.6)",
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: "rgba(42, 46, 57, 0.6)",
            },
        });

        // Main Candle Series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });

        // Volume Series
        const volSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '', // overlay
        });
        volSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        setChartApi(chart);
        setCandleSeries(candlestickSeries);
        setVolumeSeries(volSeries);

        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
            setChartApi(null);
            setCandleSeries(null);
            setVolumeSeries(null);
            indicatorSeriesRefs.current.clear();
            // Clean up vline divs
            vLineDivRefs.current.forEach(el => el.remove());
            vLineDivRefs.current = [];
        };
    }, [height]);

    // Handle Main Data
    useEffect(() => {
        if (!candleSeries || data.length === 0) return;

        try {
            const uniqueData = data
                .map(d => ({
                    ...d,
                    time: toTimestamp(d.time)
                }))
                .filter((item, index, self) => index === 0 || item.time !== self[index - 1].time)
                .sort((a, b) => (a.time as number) - (b.time as number));

            candleSeries.setData(uniqueData as any);

            if (volumeSeries) {
                const volumeData = uniqueData.map(d => ({
                    time: d.time,
                    value: (d as any).volume || 0,
                    color: (d as any).close >= (d as any).open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                }));
                volumeSeries.setData(volumeData as any);
            }
        } catch (err) {
            console.error("PriceChart: Error setting main data:", err);
        }
    }, [candleSeries, volumeSeries, data]);

    // Handle Markers
    useEffect(() => {
        if (!candleSeries) return;
        const markersToSet = (markers || []).map(m => ({
            ...m,
            time: toTimestamp(m.time),
            size: m.size || 1
        })).sort((a, b) => (a.time as number) - (b.time as number));

        try {
            (candleSeries as any).setMarkers(markersToSet);
        } catch (err) {
            console.error("PriceChart: Error setting markers:", err);
        }
    }, [candleSeries, markers]);

    // Position vline divs using chart coordinate API
    const updateVLinePositions = useCallback(() => {
        if (!chartApi || !chartContainerRef.current) return;
        const timeScale = chartApi.timeScale();

        vLineDivRefs.current.forEach((el, i) => {
            if (i >= verticalLines.length) {
                el.style.display = 'none';
                return;
            }
            const vl = verticalLines[i];
            const ts = toTimestamp(vl.time) as UTCTimestamp;
            const x = timeScale.timeToCoordinate(ts);
            if (x === null) {
                el.style.display = 'none';
            } else {
                el.style.display = 'block';
                el.style.left = `${x}px`;
            }
        });
    }, [chartApi, verticalLines]);

    // Handle Vertical Lines — CSS overlay divs for pixel-perfect straight lines
    useEffect(() => {
        if (!chartApi || !chartContainerRef.current) return;

        // Remove old vline divs
        vLineDivRefs.current.forEach(el => el.remove());
        vLineDivRefs.current = [];

        if (verticalLines.length === 0) return;

        // The chart creates its own DOM inside the container.
        // We insert our divs as the FIRST children so they render behind the canvas.
        const container = chartContainerRef.current;

        verticalLines.forEach(vl => {
            const lineEl = document.createElement('div');
            lineEl.style.cssText = `
                position: absolute;
                top: 0;
                bottom: 0;
                width: 0px;
                border-left: 1px dashed ${vl.color};
                pointer-events: none;
                z-index: 2;
                opacity: 0.4;
            `;
            // Insert as first child to render behind the chart canvas
            container.insertBefore(lineEl, container.firstChild);
            vLineDivRefs.current.push(lineEl);
        });

        // Position them initially
        updateVLinePositions();

        // Re-position on scroll/zoom
        chartApi.timeScale().subscribeVisibleLogicalRangeChange(updateVLinePositions);

        return () => {
            try {
                chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(updateVLinePositions);
            } catch (_) { /* chart may already be disposed */ }
            vLineDivRefs.current.forEach(el => el.remove());
            vLineDivRefs.current = [];
        };
    }, [chartApi, verticalLines, updateVLinePositions]);

    // Handle Price Lines
    useEffect(() => {
        if (!candleSeries) return;

        priceLineRefs.current.forEach(pl => {
            try { candleSeries.removePriceLine(pl); } catch (e) { }
        });
        priceLineRefs.current = [];

        (priceLines || []).forEach(plConfig => {
            const pl = candleSeries.createPriceLine({
                price: plConfig.price,
                color: plConfig.color,
                lineWidth: plConfig.lineWidth || 2,
                lineStyle: plConfig.lineStyle || 0,
                axisLabelVisible: true,
                title: plConfig.title || '',
            });
            priceLineRefs.current.push(pl);
        });
    }, [candleSeries, priceLines]);

    // Handle Indicators
    useEffect(() => {
        if (!chartApi) return;

        const currentIds = new Set(indicators.map(i => i.id));
        indicatorSeriesRefs.current.forEach((series, id) => {
            if (!currentIds.has(id)) {
                chartApi.removeSeries(series);
                indicatorSeriesRefs.current.delete(id);
            }
        });

        indicators.forEach(ind => {
            try {
                let series = indicatorSeriesRefs.current.get(ind.id);
                if (!series) {
                    if (ind.type === "Line") {
                        series = chartApi.addSeries(LineSeries, { color: ind.color, lineWidth: 2 });
                    } else {
                        series = chartApi.addSeries(HistogramSeries, { color: ind.color });
                    }
                    indicatorSeriesRefs.current.set(ind.id, series);
                }

                const indData = ind.data
                    .map(d => ({ ...d, time: toTimestamp(d.time) }))
                    .sort((a, b) => (a.time as number) - (b.time as number));

                const uniqueIndData = indData.filter((item, index, self) =>
                    index === 0 || item.time !== self[index - 1].time
                );

                series.setData(uniqueIndData as any);
            } catch (err) {
                console.error(`PriceChart: Error updating indicator ${ind.id}:`, err);
            }
        });
    }, [chartApi, indicators]);

    // Handle Focus — adapt visible range to days_forward
    useEffect(() => {
        if (!chartApi || !data.length || !focusDate) return;

        const targetTs = toTimestamp(focusDate);
        const DAY = 24 * 60 * 60;
        const daysForward = focusDaysForward || 30;
        // Show 30 days before signal and days_forward + 50% padding after
        const paddingBefore = 30 * DAY;
        const paddingAfter = Math.max(daysForward * 1.5, 30) * DAY;
        chartApi.timeScale().setVisibleRange({
            from: (targetTs - paddingBefore) as any,
            to: (targetTs + paddingAfter) as any,
        });
    }, [chartApi, data, focusDate, focusDaysForward]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full relative"
            style={{ height: `${height}px`, isolation: 'isolate' }}
        />
    );
}

