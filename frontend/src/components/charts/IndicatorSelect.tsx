import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { INDICATORS, type IndicatorMeta } from "@/types";
import { Plus } from "lucide-react";

interface IndicatorSelectProps {
    onSelect: (spec: string) => void;
}

export function IndicatorSelect({ onSelect }: IndicatorSelectProps) {
    const [selectedMeta, setSelectedMeta] = useState<IndicatorMeta | null>(null);
    const [params, setParams] = useState<Record<string, number>>({});
    const [open, setOpen] = useState(false);

    const handleSelectMeta = (value: string) => {
        const meta = INDICATORS.find(i => i.value === value) || null;
        setSelectedMeta(meta);
        if (meta) {
            const initialParams: Record<string, number> = {};
            meta.params.forEach(p => initialParams[p.name] = p.default);
            setParams(initialParams);
        }
    };

    const handleAdd = () => {
        if (!selectedMeta) return;

        // Construct spec: NAME_VAL1_VAL2...
        let spec = selectedMeta.value;
        selectedMeta.params.forEach(p => {
            spec += `_${params[p.name]}`;
        });

        onSelect(spec);
        setOpen(false);
        setSelectedMeta(null);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Indicator
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Indicator</h4>
                        <Select value={selectedMeta?.value} onValueChange={handleSelectMeta}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select indicator..." />
                            </SelectTrigger>
                            <SelectContent>
                                {INDICATORS.map((ind) => (
                                    <SelectItem key={ind.value} value={ind.value}>
                                        {ind.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedMeta && selectedMeta.params.length > 0 && (
                        <div className="grid gap-4">
                            {selectedMeta.params.map(p => (
                                <div key={p.name} className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor={p.name}>{p.label}</Label>
                                    <Input
                                        id={p.name}
                                        type="number"
                                        className="col-span-2 h-8"
                                        value={params[p.name]}
                                        onChange={(e) => setParams({ ...params, [p.name]: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <Button onClick={handleAdd} disabled={!selectedMeta} className="w-full">
                        Add to Chart
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
