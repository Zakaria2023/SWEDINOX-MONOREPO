"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseQuoteFormValues } from "@/app/(dashboard)/purchase-quotes/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  purchaseOrderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
  /** Greyed once a line exists, as the reference greys them. */
  locked: boolean;
};

/**
 * The reference's header, right block on a quote: `Purchase order type` —
 * `Materials` with the second dropdown below it, `☑ Overlength` and
 * `☐ Consignatie` (one consignment flag per quote, not per line) — then the
 * `Quote` block: the supplier's `Quote No`, `Quote date` and `Valid u/i`.
 *
 * A quote carries no printed/mailed stamps and no `Do not print prices`, so
 * this is its own section rather than the purchase order's.
 */
export const PurchaseQuoteTypeSection = ({
  purchaseOrderTypeOptions,
  weightTypeOptions,
  locked,
}: Props) => {
  const { control, register } = useFormContext<PurchaseQuoteFormValues>();

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

        {/* `Consignatie` in the reference, untranslated, directly under
            Overlength. */}
        <Controller
          control={control}
          name="isConsignment"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Consignment
            </label>
          )}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Quote</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* The supplier's own number — blank on 900000, where 900000 is
              ours and prints in the banner. */}
          <div>
            <FormLabel htmlFor="quoteNumber">Quote No</FormLabel>
            <Input id="quoteNumber" {...register("quoteNumber")} />
          </div>
          <div>
            <FormLabel htmlFor="quoteDate">Quote date</FormLabel>
            <Controller
              name="quoteDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="quoteDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <FormLabel htmlFor="validUntil">Valid u/i</FormLabel>
            <Controller
              name="validUntil"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="validUntil"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
