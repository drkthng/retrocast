import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import ScenarioList from "@/components/scenarios/ScenarioList";
import ScenarioEditor from "@/components/scenarios/ScenarioEditor";
import ResultsDashboard from "@/components/results/ResultsDashboard";
import ChartView from "@/components/charts/ChartView";

// Settings placeholder
const Settings = () => <div className="p-6">Settings page</div>;

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
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
