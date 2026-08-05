"use client";

import { InvoiceFormValues } from "@/app/(dashboard)/invoices/validation";
import { useFormContext } from "react-hook-form";

type InvoiceAmountsSectionProps = {
  isPending: boolean;
};

export const InvoiceAmountsSection = ({
  isPending,
}: InvoiceAmountsSectionProps) => {
  const { register } = useFormContext<InvoiceFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
        Amounts
      </h2>
      <div className="space-y-2 pt-1">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            id="calculateVat"
            {...register("calculateVat")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <span className="text-sm font-medium text-foreground">
            Calculate VAT
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            id="printed"
            {...register("printed")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <span className="text-sm font-medium text-foreground">Printed</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            id="mailed"
            {...register("mailed")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <span className="text-sm font-medium text-foreground">Mailed</span>
        </label>
      </div>
    </div>
  );
};
