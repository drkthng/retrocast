import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { INDICATORS } from "@/types";
import type { Indicator } from "@/types";

export default function ConditionBuilder() {
    const { control, watch } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "conditions",
    });

    const addCondition = () => {
        append({
            indicator: "SMA",
            params: { period: 20 },
            operator: "ABOVE",
            compare_to: "PRICE",
            connector: "AND"
        });
    };

    return (
        <div className="space-y-4">
            {fields.map((field, index) => {
                const indicatorValue = watch(`conditions.${index}.indicator`) as Indicator;
                const metadata = INDICATORS.find(i => i.value === indicatorValue);

                return (
                    <Card key={field.id} className="relative">
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name={`conditions.${index}.indicator`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Indicator</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {INDICATORS.map(ind => (
                                                        <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name={`conditions.${index}.operator`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Operator</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ABOVE">Above</SelectItem>
                                                    <SelectItem value="BELOW">Below</SelectItem>
                                                    <SelectItem value="CROSSES_ABOVE">Crosses Above</SelectItem>
                                                    <SelectItem value="CROSSES_BELOW">Crosses Below</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Dynamic Parameters */}
                            {metadata && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {metadata.params.map(param => (
                                        <FormField
                                            key={param.name}
                                            control={control}
                                            name={`conditions.${index}.params.${param.name}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{param.label}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-8"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Remove Condition
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addCondition}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
            </Button>
        </div>
    );
}
