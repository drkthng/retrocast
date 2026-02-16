import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScenarios } from "@/hooks/useScenarios";
import { ScenarioCard } from "./ScenarioCard";
import { useAnalysis } from "@/hooks/useAnalysis";
import { toast } from "sonner";

export default function ScenarioList() {
    const { scenarios, isLoading, error, fetchScenarios, deleteScenario } = useScenarios();
    const { runAnalysis } = useAnalysis();
    const navigate = useNavigate();

    useEffect(() => {
        fetchScenarios();
    }, [fetchScenarios]);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this scenario?")) {
            await deleteScenario(id);
        }
    };

    const handleRun = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toast.info("Starting analysis...");
        await runAnalysis(id);
        toast.success("Analysis started");
        navigate(`/scenarios/${id}/results`);
    };

    return (
        <div className="h-full flex flex-col">
            <PageHeader title="Scenarios">
                <Link to="/scenarios/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Scenario
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search scenarios..." className="pl-9" />
                        </div>
                    </div>

                    {isLoading && <div className="text-center py-10 text-muted-foreground">Loading scenarios...</div>}

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                            Error: {error}
                        </div>
                    )}

                    {!isLoading && !error && scenarios.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card/50">
                            <h3 className="text-lg font-medium">No scenarios found</h3>
                            <p className="text-muted-foreground mb-4">Create your first trading scenario to get started.</p>
                            <Link to="/scenarios/new">
                                <Button variant="secondary">Create Scenario</Button>
                            </Link>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {scenarios.map((scenario) => (
                            <ScenarioCard
                                key={scenario.id}
                                scenario={scenario}
                                onRun={handleRun}
                                onDelete={(id, e) => { e.stopPropagation(); handleDelete(id); }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
