import { useState, useCallback } from "react";
import { dataApi } from "@/services/api";

interface OHLCV {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface UseChartDataReturn {
    ohlcv: OHLCV[];
    isLoading: boolean;
    error: string | null;
    fetchOHLCV: (ticker: string, source: string) => Promise<void>;
}

export function useChartData(): UseChartDataReturn {
    const [ohlcv, setOhlcv] = useState<OHLCV[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOHLCV = useCallback(async (ticker: string, source: string) => {
        if (!ticker) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await dataApi.ohlcv({
                ticker,
                source,
                start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 1 year 
            });

            // Transform data for Lightweight Charts
            // Backend returns list of dicts: { date, open, high, low, close, volume }
            const data = response.data.map((d: any) => ({
                time: d.date, // string 'YYYY-MM-DD'
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                volume: d.volume,
            }));

            // Sort by date ascending is required by lightweight-charts
            data.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

            setOhlcv(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch chart data");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        ohlcv,
        isLoading,
        error,
        fetchOHLCV
    };
}
