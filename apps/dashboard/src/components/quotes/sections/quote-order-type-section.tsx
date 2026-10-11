"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { ORDER_TYPE_LABELS } from "@/lib/labels";

type Props = {
  weightTypeOptions: SelectOption[];
  consignmentDurationOptions: SelectOption[];
  consignmentDurationUnitOptions: SelectOption[];
};

type FlagName =
  | "isPickup"
  | "isIncidental"
  | "isInternalProduction"
  | "isCustomerMaterial"
  | "isOverlength";

type FlagProps = {
  name: FlagName;
  label: string;
  disabled?: boolean;
};

const Flag = ({ name, label, disabled = false }: FlagProps) => {
  const { control } = useFormContext<QuoteFormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label
          className={
            disabled
              ? "flex items-center gap-2 text-sm text-muted-foreground"
              : "flex cursor-pointer items-center gap-2 text-sm"
          }
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
          />
          {label}
        </label>
      )}
    />
  );
};

/**
 * The reference's header, right block: the order type — `Pick-up`,
 * `Incidental`, `Consignment with a duration of …`, `Internal
 * production/processing` (set by the system, greyed), `Klant materiaal`, the
 * `Normal` dropdown, the `Trade weight` dropdown and `Overlength` — then the
 * three sent-stamps, which printing and sending set and nobody ticks.
 */
export const QuoteOrderTypeSection = ({
  weightTypeOptions,
  consignmentDurationOptions,
  consignmentDurationUnitOptions,
}: Props) => {
  const { control } = useFormContext<QuoteFormValues>();
  const [isConsignment, isPrinted, isMailed, isFaxed] = useWatch({
    control,
    name: ["isConsignment", "isPrinted", "isMailed", "isFaxed"],
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Order type</h2>

      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        <Flag name="isPickup" label="Pick-up" />
        <Flag name="isIncidental" label="Incidental" />
        <Flag
          name="isInternalProduction"
          label="Internal production/processing"
          disabled
        />
        <Flag name="isCustomerMaterial" label="Customer material" />
      </div>

      {/* "with a duration of [..] u/i [..]", greyed until the box is ticked
          (#392): consignment is a term, not a boolean. */}
      <div className="flex flex-wrap items-end gap-3">
        <Controller
          control={control}
          name="isConsignment"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Consignment with a duration of
            </label>
          )}
        />
        <div className="w-24">
          <FormSelectField
            control={control}
            id="consignmentDuration"
            name="consignmentDuration"
            label="Duration"
            options={consignmentDurationOptions}
            emptyValue=""
            disabled={!isConsignment}
          />
        </div>
        <div className="w-36">
          <FormSelectField
            control={control}
            id="consignmentDurationUnit"
            name="consignmentDurationUnit"
            label="u/i"
            options={consignmentDurationUnitOptions}
            emptyValue=""
            disabled={!isConsignment}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* The `Normal` dropdown: a quote has no order-type column yet, so it
            reads Normal and is greyed. */}
        <div>
          <FormLabel htmlFor="orderType">Type</FormLabel>
          <Select
            id="orderType"
            options={[{ value: "normal", label: ORDER_TYPE_LABELS.normal }]}
            value="normal"
            disabled
          />
        </div>

        <FormSelectField
          control={control}
          id="weightType"
          name="weightType"
          label="Weight type"
          options={weightTypeOptions}
          emptyValue=""
        />
      </div>

      <Flag name="isOverlength" label="Overlength" />

      <div className="space-y-1.5 border-t pt-3">
        {(
          [
            ["Printed", isPrinted],
            ["Mailed", isMailed],
            ["Faxed", isFaxed],
          ] as const
        ).map(([label, checked]) => (
          <label
            key={label}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <input type="checkbox" checked={checked} disabled readOnly />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
};
