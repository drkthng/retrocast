import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    ChevronLeft,
    ChevronRight,
    LineChart,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useScenarios } from "@/hooks/useScenarios";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { scenarios, fetchScenarios } = useScenarios();

    useEffect(() => {
        fetchScenarios();
    }, [fetchScenarios]);

    // Get 5 most recent scenarios
    const recentScenarios = scenarios.slice(0, 5);

    return (
        <aside
            className={cn(
                "flex flex-col border-r bg-card transition-all duration-300 ease-in-out h-screen sticky top-0",
                collapsed ? "w-[60px]" : "w-[240px]"
            )}
        >
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!collapsed && <span className="font-bold text-lg tracking-tight text-primary">Retrocast</span>}
                {collapsed && <LineChart className="w-6 h-6 text-primary" />}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", collapsed && "hidden")}
                    onClick={() => setCollapsed(true)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-hidden">
                <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
                <NavItem to="/scenarios/new" icon={PlusCircle} label="New Scenario" collapsed={collapsed} />

                {!collapsed && (
                    <div className="mt-6 px-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Recent Scenarios
                        </h3>
                        <ScrollArea className="h-[300px] -mx-3 px-3">
                            <div className="space-y-1">
                                {recentScenarios.map((s) => (
                                    <Link
                                        key={s.id}
                                        to={`/scenarios/${s.id}`}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                                    >
                                        <FileText className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-primary" />
                                        <span className="truncate">{s.name}</span>
                                    </Link>
                                ))}
                                {recentScenarios.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground italic px-2">No scenarios yet</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                <div className="flex-1" />
                <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
            </nav>

            <div className="p-2 border-t">
                {collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-full h-10"
                        onClick={() => setCollapsed(false)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </aside>
    );
}

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    collapsed: boolean;
}

function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    collapsed && "justify-center px-0"
                )
            }
        >
            <Icon className="h-5 w-5" />
            {!collapsed && <span>{label}</span>}
        </NavLink>
    );
}
