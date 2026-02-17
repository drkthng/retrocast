import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-6 bg-destructive/5 text-destructive">
                    <div className="max-w-2xl w-full bg-card border border-destructive/20 rounded-lg shadow-lg p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-destructive/10 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                        </div>

                        <p className="mb-6 text-muted-foreground">
                            The application encountered an unexpected error. This might be due to a problem with the chart data or a software bug.
                        </p>

                        <div className="bg-black/5 p-4 rounded-md mb-6 overflow-auto max-h-64 font-mono text-xs">
                            <p className="font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre className="whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="default"
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
