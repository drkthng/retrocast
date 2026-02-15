import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScenarios } from "@/hooks/useScenarios";
import type { ScenarioCreate } from "@/types";
import { Loader2, Save } from "lucide-react";
import ConditionBuilder from "./ConditionBuilder";
import TargetBuilder from "./TargetBuilder";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    underlying: z.string().min(1, "Underlying symbol is required"),
    data_source: z.enum(["CSV", "YAHOO", "NORGATE"] as const),
    csv_path: z.string().optional(),
    conditions: z.array(z.any()).min(1, "At least one condition is required"),
    targets: z.array(z.any()).min(1, "At least one target is required"),
});

export default function ScenarioEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchScenario, scenario, createScenario, updateScenario, isLoading } = useScenarios();
    const isEditMode = !!id;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            underlying: "",
            data_source: "YAHOO",
            csv_path: "",
            conditions: [],
            targets: [],
        },
    });

    useEffect(() => {
        if (isEditMode && id) {
            fetchScenario(id);
        }
    }, [id, isEditMode, fetchScenario]);

    useEffect(() => {
        if (isEditMode && scenario) {
            form.reset({
                name: scenario.name,
                description: scenario.description,
                underlying: scenario.underlying,
                data_source: scenario.data_source,
                csv_path: scenario.csv_path || "",
                conditions: scenario.conditions,
                targets: scenario.targets,
            });
        }
    }, [scenario, isEditMode, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const data: ScenarioCreate = {
            ...values,
            csv_path: values.data_source === "CSV" ? values.csv_path : undefined,
            description: values.description || "",
            timeframe: "1d",
            conditions: values.conditions as any,
            targets: values.targets as any,
        };

        let result;
        if (isEditMode && id) {
            result = await updateScenario(id, data);
        } else {
            result = await createScenario(data);
        }

        if (result) {
            navigate("/");
        }
    };

    if (isEditMode && isLoading && !scenario) {
        return <div className="p-10 text-center">Loading scenario...</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <PageHeader title={isEditMode ? "Edit Scenario" : "New Scenario"}>
                <Button variant="ghost" onClick={() => navigate("/")}>Cancel</Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Scenario
                </Button>
            </PageHeader>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto pb-20">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Section 1: Basics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Scenario Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. SMA Crossover Strategy" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Describe the hypotheses..." className="resize-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="underlying"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Underlying Symbol</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. SPY, AAPL, BTC-USD" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="data_source"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Data Source</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select data source" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="YAHOO">Yahoo Finance</SelectItem>
                                                            <SelectItem value="CSV">CSV File</SelectItem>
                                                            <SelectItem value="NORGATE">Norgate Data</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Condition Builder */}
                            <Card>
                                <CardHeader><CardTitle>Conditions</CardTitle></CardHeader>
                                <CardContent>
                                    <ConditionBuilder />
                                </CardContent>
                            </Card>

                            {/* Target Builder */}
                            <Card>
                                <CardHeader><CardTitle>Targets</CardTitle></CardHeader>
                                <CardContent>
                                    <TargetBuilder />
                                </CardContent>
                            </Card>

                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
