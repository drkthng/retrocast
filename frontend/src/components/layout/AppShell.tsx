import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";

export function AppShell() {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>
            <Toaster richColors closeButton position="bottom-right" />
        </div>
    );
}
