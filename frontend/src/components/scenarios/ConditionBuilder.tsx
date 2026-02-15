import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ConditionRow from "./ConditionRow";

export default function ConditionBuilder() {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "conditions",
    });

    const addCondition = () => {
        append({
            indicator: "SMA",
            params: { period: 200 },
            operator: "ABOVE",
            compare_to: "PRICE",
            connector: "AND"
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <ConditionRow
                        key={field.id}
                        index={index}
                        onRemove={() => remove(index)}
                    />
                ))}
            </div>

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
