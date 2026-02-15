import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
// import { Toaster } from "@/components/ui/sonner"; // Assuming sonner/toast is installed or will be

export function AppShell() {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>
            {/* <Toaster /> Placeholder for toast notifications */}
        </div>
    );
}
