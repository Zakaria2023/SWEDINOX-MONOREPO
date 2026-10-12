"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

const SENT_FLAGS = [
  { name: "isPrinted", label: "Printed" },
  { name: "isMailed", label: "Mailed" },
  { name: "isFaxed", label: "Faxed" },
  { name: "messageSentViaStaalWeb", label: "Message sent via StaalWeb" },
] as const;

type Props = {
  purchaseOrderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
  /** Greyed once the request is saved, as the reference's are. */
  locked: boolean;
};

/**
 * The reference's header, right block on a request: `Purchase order type` —
 * `Materials` with the weight type below it, `Overlength` ticked, the four
 * greyed sent-stamps — then `Follow-up` and the `Deadline` (11-10-2026).
 * The purchase order's own block also offers `Do not print prices`, which a
 * request does not, so this is its own section rather than that one.
 */
export const PurchaseRequestTypeSection = ({
  purchaseOrderTypeOptions,
  weightTypeOptions,
  locked,
}: Props) => {
  const { control } = useFormContext<PurchaseRequestFormValues>();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Purchase order type</h2>

        <FormSelectField
          control={control}
          id="purchaseOrderType"
          name="purchaseOrderType"
          label="Type"
          options={purchaseOrderTypeOptions}
          emptyValue=""
          disabled={locked}
        />

        <FormSelectField
          control={control}
          id="weightType"
          name="weightType"
          label="Weight type"
          options={weightTypeOptions}
          emptyValue=""
          disabled={locked}
        />

        <Controller
          control={control}
          name="isOverlength"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.value}
                disabled={locked}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Overlength
            </label>
          )}
        />

        {/* Stamps, not choices: printing, mailing and sending set them. */}
        <div className="space-y-1.5 border-t pt-3 text-muted-foreground">
          {SENT_FLAGS.map(({ name, label }) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    disabled
                    readOnly
                  />
                  {label}
                </label>
              )}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Follow-up</h2>
        {/* Empty on a blank request in the reference. */}
        <div className="h-16 rounded-md border bg-muted/30" />
        <div className="max-w-xs">
          <FormLabel htmlFor="deadline">Deadline</FormLabel>
          <Controller
            control={control}
            name="deadline"
            render={({ field }) => (
              <DatePicker
                id="deadline"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </section>
    </div>
  );
};
