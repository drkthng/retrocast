import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import ScenarioList from "@/components/scenarios/ScenarioList";
import ScenarioEditor from "@/components/scenarios/ScenarioEditor";
import ResultsDashboard from "@/components/results/ResultsDashboard";
import ChartView from "@/components/charts/ChartView";
import SettingsView from "@/components/settings/SettingsView";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ScenarioList />} />
          <Route path="/scenarios/new" element={<ScenarioEditor />} />
          <Route path="/scenarios/:id" element={<ScenarioEditor />} />
          <Route path="/scenarios/:id/results" element={<ResultsDashboard />} />
          <Route path="/scenarios/:id/chart" element={<ChartView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
