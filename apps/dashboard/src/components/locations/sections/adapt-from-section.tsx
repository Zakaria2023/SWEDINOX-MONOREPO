"use client";

import { useFormContext } from "react-hook-form";
import { LocationFormValues } from "@/app/(dashboard)/locations/validation";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { SelectOption } from "@/components/shadcn/select";
import { cn } from "@/lib/helpers";

type Props = {
  adaptFromOptions: SelectOption[];
  isNextDisabled: boolean;
  handleAdaptFrom: (value: string) => void;
};

export const AdaptFromSection = ({
  adaptFromOptions,
  isNextDisabled,
  handleAdaptFrom,
}: Props) => {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<LocationFormValues>();

  const placement = watch("placement");

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Adapt From
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="adaptFromUuid"
          name="adaptFromUuid"
          control={control}
          label="Warehouse / Sub Section"
          options={adaptFromOptions}
          emptyValue=""
          required
          errorMessage={errors.adaptFromUuid?.message}
          onValueChange={(value, fieldOnChange) => {
            fieldOnChange(value);
            handleAdaptFrom(value);
          }}
        />

        <div>
          <FormLabel htmlFor="placement">Placement</FormLabel>
          <div className="mt-1 flex overflow-hidden rounded-md border">
            <button
              type="button"
              disabled={isNextDisabled}
              onClick={() => setValue("placement", "next")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                placement === "next"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:bg-muted",
                isNextDisabled && "cursor-not-allowed opacity-40",
              )}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setValue("placement", "below")}
              className={cn(
                "flex-1 border-l px-4 py-2 text-sm font-medium transition-colors",
                placement === "below"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              Below
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {placement === "next"
              ? "New location will be a sibling of the selected item"
              : "New location will be a child of the selected item"}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        All fields are inherited from the selected item. You can adjust any
        field before saving.
      </p>
    </section>
  );
};
