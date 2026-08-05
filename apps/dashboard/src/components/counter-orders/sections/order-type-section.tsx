"use client";

import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
};

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

const CheckboxField = ({
  label,
  checked,
  onChange,
  disabled,
}: CheckboxFieldProps) => (
  <label className="flex cursor-pointer items-center gap-2">
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export const OrderTypeSection = ({ isPending }: Props) => {
  const { control } = useFormContext<CounterOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Order type
      </h2>
      <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Controller
          name="isPickup"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Pick-up"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="isIncidental"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Incidental"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="isOverlength"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Overlength"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="handlingBlocked"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Handling blocked"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="printPickingSlips"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Print picking slips"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="leaveCustomer"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Leave customer"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="isPrinted"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Printed"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="isMailed"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Mailed"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Controller
          name="isFaxed"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Faxed"
              checked={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
      </div>
    </section>
  );
};
