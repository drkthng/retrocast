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

export default function TargetBuilder() {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "targets",
    });

    const addTarget = () => {
        append({
            days_forward: 5,
            threshold_pct: 1.0,
            direction: "ABOVE"
        });
    };

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                            <FormField
                                control={control}
                                name={`targets.${index}.days_forward`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Days Forward</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`targets.${index}.threshold_pct`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Threshold %</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`targets.${index}.direction`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Direction</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ABOVE">Above (Long)</SelectItem>
                                                <SelectItem value="BELOW">Below (Short)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addTarget}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Target
            </Button>
        </div>
    );
}
