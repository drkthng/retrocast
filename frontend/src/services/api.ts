import axios from 'axios';
import type { AnalysisResult, Scenario, ScenarioCreate, ScenarioSummary } from '@/types';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 120000, // 2 min timeout for analysis runs
});

// Typed API functions
export const scenarioApi = {
    list: () => api.get<ScenarioSummary[]>('/scenarios'),
    get: (id: string) => api.get<Scenario>(`/scenarios/${id}`),
    create: (data: ScenarioCreate) => api.post<Scenario>('/scenarios', data),
    update: (id: string, data: ScenarioCreate) => api.put<Scenario>(`/scenarios/${id}`, data),
    delete: (id: string) => api.delete(`/scenarios/${id}`),
};

export const analysisApi = {
    run: (scenarioId: string) => api.post<AnalysisResult>(`/analysis/${scenarioId}/run`),
    getLast: (scenarioId: string) => api.get<AnalysisResult>(`/analysis/${scenarioId}/last`),
};

export const dataApi = {
    search: (query: string) => api.get(`/data/search`, { params: { q: query } }),
    preview: (ticker: string, source: string) => api.get(`/data/preview`, { params: { ticker, source } }),
    ohlcv: (params: { ticker: string; source: string; start?: string; end?: string }) =>
        api.get(`/data/ohlcv`, { params }),
    indicators: (params: { ticker: string; source: string; start?: string; end?: string; indicators: string }) =>
        api.get(`/data/indicators`, { params }),
};

export const exportApi = {
    csv: (scenarioId: string) => api.get(`/export/${scenarioId}/csv`, { responseType: 'blob' }),
    excel: (scenarioId: string) => api.get(`/export/${scenarioId}/excel`, { responseType: 'blob' }),
};
