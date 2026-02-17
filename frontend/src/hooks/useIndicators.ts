import { useState, useCallback } from "react";
import { dataApi } from "@/services/api";
import type { ChartIndicator } from "@/components/charts/PriceChart";

interface UseIndicatorsReturn {
    isLoading: boolean;
    error: string | null;
    fetchIndicators: (
        ticker: string,
        source: string,
        indicators: string[],
        start?: string,
        end?: string
    ) => Promise<ChartIndicator[]>;
}

export function useIndicators(): UseIndicatorsReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIndicators = useCallback(async (
        ticker: string,
        source: string,
        indicators: string[],
        start?: string,
        end?: string
    ): Promise<ChartIndicator[]> => {
        if (!ticker || indicators.length === 0) return [];

        setIsLoading(true);
        setError(null);
        try {
            const response = await dataApi.indicators({
                ticker,
                source,
                indicators: indicators.join(","),
                start,
                end
            });

            const { dates, indicators: indicatorData } = response.data;

            return Object.entries(indicatorData).map(([colName, values], index) => {
                const data = dates.map((date: string, i: number) => ({
                    time: date,
                    value: (values as any)[i]
                })).filter((d: any) => d.value !== null);

                // Determine type based on column name if needed, default to Line
                const type = colName.includes("HIST") || colName.includes("VOLUME") ? "Histogram" : "Line";

                // Color palette
                const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#06b6d4"];
                const color = colors[index % colors.length];

                return {
                    id: colName,
                    type,
                    data,
                    color
                };
            });
        } catch (err: any) {
            setError(err.message || "Failed to fetch indicators");
            console.error(err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        fetchIndicators
    };
}
