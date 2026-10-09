"use client";

import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Controller, useFormContext, useWatch } from "react-hook-form";

const PRINT_FLAGS = [
  { name: "isPrinted", label: "Printed" },
  { name: "isMailed", label: "Mailed" },
  { name: "isFaxed", label: "Faxed" },
] as const;

type Props = {
  isConsignment: boolean;
  orderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
};

export const OrderTypeSection = ({
  isConsignment,
  orderTypeOptions,
  weightTypeOptions,
}: Props) => {
  const { control } = useFormContext<OrderFormValues>();
  const orderType = useWatch({ control, name: "orderType" });
  const items = useWatch({ control, name: "items" });
  const hasLines = (items?.length ?? 0) > 0;

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Order Type</h2>

      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={control}
          name="isPickup"
          render={({ field }) => (
            <FormCheckboxCard
              label="Pick-up"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="isIncidental"
          render={({ field }) => (
            <FormCheckboxCard
              label="Incidental"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        {/* Greyed on the reference's order (108183, 8-10-2026): the system
            decides these two, the seller does not tick them. */}
        <Controller
          control={control}
          name="isInternalProduction"
          render={({ field }) => (
            <FormCheckboxCard
              label="Internal production / processing"
              checked={field.value}
              active={field.value}
              readOnly
              disabled
              title="Set by the system"
              className="cursor-not-allowed opacity-60"
            />
          )}
        />
        <Controller
          control={control}
          name="isCustomerMaterial"
          render={({ field }) => (
            <FormCheckboxCard
              label="Customer material"
              checked={field.value}
              active={field.value}
              readOnly
              disabled
              title="Set by the system"
              className="cursor-not-allowed opacity-60"
            />
          )}
        />
        <Controller
          control={control}
          name="isOverlength"
          render={({ field }) => (
            <FormCheckboxCard
              label="Overlength"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      {/* Consignment row. The duration is always on screen and greyed until
          the box is ticked, as on the reference. Its second picker (`u/i`)
          has no column on an order, so only the duration is offered. */}
      <div className="flex items-center gap-4">
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
              Consignment with a duration of
            </label>
          )}
        />
        <Controller
          control={control}
          name="consignmentDuration"
          render={({ field }) => (
            <Input
              className="w-32"
              placeholder="e.g. 30 days"
              aria-label="Consignment duration"
              value={field.value ?? ""}
              onChange={field.onChange}
              disabled={!isConsignment}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="orderType"
          name="orderType"
          label="Order type"
          options={orderTypeOptions}
        />

        {orderType === "call_off" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FormLabel htmlFor="callOffPeriodFrom">Call-off period</FormLabel>
              <Controller
                control={control}
                name="callOffPeriodFrom"
                render={({ field }) => (
                  <DatePicker
                    id="callOffPeriodFrom"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="callOffPeriodTo">up to and including</FormLabel>
              <Controller
                control={control}
                name="callOffPeriodTo"
                render={({ field }) => (
                  <DatePicker
                    id="callOffPeriodTo"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Locked once the order has lines: the lines were weighed and
            priced on it, as `Weighed` greys on the reference's 108183. */}
        <FormSelectField
          control={control}
          id="weightType"
          name="weightType"
          label="Weight type"
          options={weightTypeOptions}
          emptyValue=""
          disabled={hasLines}
        />

        {/* System-set: printing, mailing and faxing the document tick these,
            never the seller — greyed on the reference. */}
        <div className="flex items-end gap-6 pb-1">
          {PRINT_FLAGS.map((flag) => (
            <Controller
              key={flag.name}
              control={control}
              name={flag.name}
              render={({ field }) => (
                <label
                  className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground"
                  title="Set by the system"
                >
                  <input type="checkbox" checked={field.value} readOnly disabled />
                  {flag.label}
                </label>
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
