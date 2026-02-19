import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Info, Database, Palette } from "lucide-react";

export default function SettingsView() {
    return (
        <div className="h-full flex flex-col">
            <PageHeader title="Settings" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* General Information */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">General Information</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Retrocast</CardTitle>
                                <CardDescription>Version 0.1.0-alpha</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Retrocast is a scenario backtesting and analysis tool for financial data.
                                    Analyze historical performance of various indicators and conditions to refine your trading strategies.
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground">Backend Status</Label>
                                        <p className="font-medium text-green-500">Connected</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Database</Label>
                                        <p className="font-medium">SQLite (Local)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <Separator />

                    {/* Data Sources */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Data Sources</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Market Data</CardTitle>
                                <CardDescription>Configure where the application fetches financial data.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-md">
                                        <div>
                                            <p className="font-medium">Yahoo Finance</p>
                                            <p className="text-xs text-muted-foreground">Default source for global stocks and ETFs.</p>
                                        </div>
                                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">ACTIVE</div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-md opacity-50 cursor-not-allowed">
                                        <div>
                                            <p className="font-medium">Local CSV</p>
                                            <p className="text-xs text-muted-foreground">Upload and analyze your own data files.</p>
                                        </div>
                                        <div className="text-muted-foreground px-2 py-0.5 rounded text-xs font-bold font-mono">COMING SOON</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <Separator />

                    {/* Appearance */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Palette className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Appearance</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Theme</CardTitle>
                                <CardDescription>Customize the look and feel of the application.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 border-2 border-primary rounded-lg text-center cursor-default">
                                        <div className="w-full h-12 bg-slate-900 rounded mb-2 border"></div>
                                        <span className="text-sm font-medium">Dark Mode</span>
                                    </div>
                                    <div className="flex-1 p-4 border rounded-lg text-center opacity-50 cursor-not-allowed">
                                        <div className="w-full h-12 bg-slate-50 rounded mb-2 border"></div>
                                        <span className="text-sm font-medium">Light Mode</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    );
}
