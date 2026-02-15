import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    ChevronLeft,
    ChevronRight,
    LineChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col border-r bg-card transition-all duration-300 ease-in-out h-screen sticky top-0",
                collapsed ? "w-[60px]" : "w-[200px]"
            )}
        >
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!collapsed && <span className="font-bold text-lg tracking-tight">ScenarioAnalyzer</span>}
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

            <nav className="flex-1 py-4 flex flex-col gap-2 px-2">
                <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
                <NavItem to="/scenarios/new" icon={PlusCircle} label="New Scenario" collapsed={collapsed} />
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
