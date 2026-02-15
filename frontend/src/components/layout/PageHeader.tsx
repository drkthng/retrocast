import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
    return (
        <header className={cn("flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">
                {children}
            </div>
        </header>
    );
}
