import { useState, useCallback } from "react";
import { scenarioApi } from "@/services/api";
import type { Scenario, ScenarioCreate, ScenarioSummary } from "@/types";
import { toast } from "sonner"; // Use toast for notifications

interface UseScenariosReturn {
    scenarios: ScenarioSummary[];
    scenario: Scenario | null;
    isLoading: boolean;
    error: string | null;
    fetchScenarios: () => Promise<void>;
    fetchScenario: (id: string) => Promise<void>;
    createScenario: (data: ScenarioCreate) => Promise<Scenario | null>;
    updateScenario: (id: string, data: ScenarioCreate) => Promise<Scenario | null>;
    deleteScenario: (id: string) => Promise<boolean>;
}

export function useScenarios(): UseScenariosReturn {
    const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchScenarios = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await scenarioApi.list();
            setScenarios(response.data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch scenarios");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchScenario = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await scenarioApi.get(id);
            setScenario(response.data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch scenario");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createScenario = useCallback(async (data: ScenarioCreate) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await scenarioApi.create(data);
            toast.success("Scenario created successfully");
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Failed to create scenario";
            setError(msg);
            toast.error(msg);
            console.error(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateScenario = useCallback(async (id: string, data: ScenarioCreate) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await scenarioApi.update(id, data);
            setScenario(response.data);
            toast.success("Scenario updated successfully");
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Failed to update scenario";
            setError(msg);
            toast.error(msg);
            console.error(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteScenario = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await scenarioApi.delete(id);
            setScenarios((prev) => prev.filter((s) => s.id !== id));
            toast.success("Scenario deleted");
            return true;
        } catch (err: any) {
            setError(err.message || "Failed to delete scenario");
            console.error(err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        scenarios,
        scenario,
        isLoading,
        error,
        fetchScenarios,
        fetchScenario,
        createScenario,
        updateScenario,
        deleteScenario,
    };
}
