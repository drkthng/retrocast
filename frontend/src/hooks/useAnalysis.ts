import { useState, useCallback } from "react";
import { analysisApi } from "@/services/api";
import type { AnalysisResult } from "@/types";

interface UseAnalysisReturn {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    isLoadingResult: boolean;
    error: string | null;
    runAnalysis: (scenarioId: string) => Promise<void>;
    fetchLastResult: (scenarioId: string) => Promise<void>;
}

export function useAnalysis(): UseAnalysisReturn {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoadingResult, setIsLoadingResult] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = useCallback(async (scenarioId: string) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await analysisApi.run(scenarioId);
            setResult(response.data);
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Analysis failed";
            setError(msg);
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const fetchLastResult = useCallback(async (scenarioId: string) => {
        setIsLoadingResult(true);
        setError(null);
        try {
            const response = await analysisApi.getLast(scenarioId);
            setResult(response.data);
        } catch (err: any) {
            // If 404, just means no result yet, maybe don't loop error?
            // But here we set error if it fails.
            if (err.response?.status !== 404) {
                setError(err.message || "Failed to fetch results");
            }
            console.error(err);
        } finally {
            setIsLoadingResult(false);
        }
    }, []);

    return {
        result,
        isAnalyzing,
        isLoadingResult,
        error,
        runAnalysis,
        fetchLastResult,
    };
}
