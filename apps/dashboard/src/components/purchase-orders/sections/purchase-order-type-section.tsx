"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { SelectOption } from "@/components/shadcn/select";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  purchaseOrderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
  /** Greyed once a line exists, as the reference greys them. */
  locked: boolean;
};

/**
 * The reference's header, right block: `Purchase order type` — the type, the
 * weight type, `Overlength`, the four sent-stamps and `Do not print prices`.
 */
export const PurchaseOrderTypeSection = ({
  purchaseOrderTypeOptions,
  weightTypeOptions,
  locked,
}: Props) => {
  const { register, control } = useFormContext<PurchaseOrderFormValues>();

  return (
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
          <label
            className={
              locked
                ? "flex items-center gap-2 text-sm text-muted-foreground"
                : "flex cursor-pointer items-center gap-2 text-sm"
            }
          >
            <input
              type="checkbox"
              disabled={locked}
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            Overlength
          </label>
        )}
      />

      {/* Stamps, not choices: the reference greys all four on a new order —
          printing, mailing and sending set them, nobody ticks them. */}
      <div className="space-y-1.5 border-t pt-3 text-muted-foreground">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled {...register("isPrinted")} />
          Printed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled {...register("isMailed")} />
          Mailed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled {...register("isFaxed")} />
          Faxed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled
            {...register("messageSentViaStaalWeb")}
          />
          Message sent via StaalWeb
        </label>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" {...register("doNotPrintPrices")} />
        Do not print prices
      </label>
    </section>
  );
};
