import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { INDICATORS } from "@/types";

interface IndicatorSelectProps {
    onSelect: (indicator: string) => void;
}

export function IndicatorSelect({ onSelect }: IndicatorSelectProps) {
    return (
        <Select onValueChange={onSelect}>
            <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Add Indicator" />
            </SelectTrigger>
            <SelectContent>
                {INDICATORS.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
