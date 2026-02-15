import { useFormContext } from "react-hook-form";
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
    FormMessage,
} from "@/components/ui/form";
import { Trash2 } from "lucide-react";
import { INDICATORS } from "@/types";
import type { Indicator } from "@/types";

interface ConditionRowProps {
    index: number;
    onRemove: () => void;
}

export default function ConditionRow({ index, onRemove }: ConditionRowProps) {
    const { control, watch } = useFormContext();

    const indicatorValue = watch(`conditions.${index}.indicator`) as Indicator;
    const compareTo = watch(`conditions.${index}.compare_to`) as string;
    const compareIndicator = watch(`conditions.${index}.compare_indicator`) as Indicator;

    const leftMetadata = INDICATORS.find(i => i.value === indicatorValue);
    const rightMetadata = INDICATORS.find(i => i.value === compareIndicator);

    return (
        <div className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-card/50">
            {/* LEFT SIDE: Indicator */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
                <span className="text-xs font-medium text-muted-foreground ml-1">Indicator</span>
                <FormField
                    control={control}
                    name={`conditions.${index}.indicator`}
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
            </div>

            {/* LEFT SIDE: Params */}
            {leftMetadata && leftMetadata.params.length > 0 && (
                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-md self-end h-9">
                    {leftMetadata.params.map(param => (
                        <FormField
                            key={param.name}
                            control={control}
                            name={`conditions.${index}.params.${param.name}`}
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-1.5 space-y-0">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{param.label}</span>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            className="h-6 w-16 px-1.5 text-xs"
                                            {...field}
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
            )}

            {/* OPERATOR */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
                <span className="text-xs font-medium text-muted-foreground ml-1">Operator</span>
                <FormField
                    control={control}
                    name={`conditions.${index}.operator`}
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-9 font-medium border-primary/20 bg-primary/5 uppercase text-[11px] tracking-wider">
                                        <SelectValue />
                                    </SelectTrigger>
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

            {/* COMPARE TO (Type) */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
                <span className="text-xs font-medium text-muted-foreground ml-1">Compare To</span>
                <FormField
                    control={control}
                    name={`conditions.${index}.compare_to`}
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PRICE">Close Price</SelectItem>
                                    <SelectItem value="VALUE">Fixed Value</SelectItem>
                                    <SelectItem value="INDICATOR">Indicator</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* RIGHT SIDE: Config */}
            {compareTo === "VALUE" && (
                <div className="flex flex-col gap-1.5 min-w-[80px]">
                    <span className="text-xs font-medium text-muted-foreground ml-1">Value</span>
                    <FormField
                        control={control}
                        name={`conditions.${index}.compare_value`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        placeholder="0.0"
                                        value={field.value ?? ""}
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}

            {compareTo === "INDICATOR" && (
                <>
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <span className="text-xs font-medium text-muted-foreground ml-1">Indicator</span>
                        <FormField
                            control={control}
                            name={`conditions.${index}.compare_indicator`}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                    </div>

                    {rightMetadata && rightMetadata.params.length > 0 && (
                        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-md self-end h-9">
                            {rightMetadata.params.map(param => (
                                <FormField
                                    key={param.name}
                                    control={control}
                                    name={`conditions.${index}.compare_indicator_params.${param.name}`}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-1.5 space-y-0">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{param.label}</span>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="h-6 w-16 px-1.5 text-xs"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* CONNECTOR (AND/OR) */}
            <div className="flex flex-col gap-1.5 ml-auto">
                <span className="text-xs font-medium text-muted-foreground ml-1">Next</span>
                <FormField
                    control={control}
                    name={`conditions.${index}.connector`}
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-9 w-16 px-2"><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="AND">AND</SelectItem>
                                    <SelectItem value="OR">OR</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            </div>

            {/* REMOVE BUTTON */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
