"use client";

import { useFormContext } from "react-hook-form";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";

type Props = {
  isPending: boolean;
  formatAmount: (val: string) => string;
  totalExclVat: number;
  totalInclVat: number;
  remainder: number;
  totalGeneral: number;
};

export const PurchaseInvoiceSummarySection = ({
  isPending,
  formatAmount,
  totalExclVat,
  totalInclVat,
  remainder,
  totalGeneral,
}: Props) => {
  const { register } = useFormContext<PurchaseInvoiceFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Summary
      </h2>

      <div className="space-y-3">
        <div>
          <FormLabel htmlFor="materials">Materials</FormLabel>
          <Input
            id="materials"
            type="number"
            step="0.01"
            {...register("materials")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="optionsAmount">Options</FormLabel>
          <Input
            id="optionsAmount"
            type="number"
            step="0.01"
            {...register("optionsAmount")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="surcharges">Surcharges</FormLabel>
          <Input
            id="surcharges"
            type="number"
            step="0.01"
            {...register("surcharges")}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="rounded-md border bg-gray-50 p-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Tot. excl. VAT</span>
          <span className="font-medium">{formatAmount(totalExclVat.toFixed(2))}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <FormLabel htmlFor="vatHigh">VAT High</FormLabel>
          <Input
            id="vatHigh"
            type="number"
            step="0.01"
            {...register("vatHigh")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="vatMiddle">VAT Middle</FormLabel>
          <Input
            id="vatMiddle"
            type="number"
            step="0.01"
            {...register("vatMiddle")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="vatLow">VAT Low</FormLabel>
          <Input
            id="vatLow"
            type="number"
            step="0.01"
            {...register("vatLow")}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="rounded-md border bg-gray-50 p-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Tot. incl. VAT</span>
          <span className="font-medium">{formatAmount(totalInclVat.toFixed(2))}</span>
        </div>
      </div>

      <div>
        <FormLabel htmlFor="creditRestriction">Credit Restriction</FormLabel>
        <Input
          id="creditRestriction"
          type="number"
          step="0.01"
          {...register("creditRestriction")}
          disabled={isPending}
        />
      </div>

      <div className="rounded-md border bg-gray-50 p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Remainder</span>
          <span className={`font-medium ${remainder < 0 ? "text-red-600" : ""}`}>
            {formatAmount(remainder.toFixed(2))}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Tot. general</span>
          <span>{formatAmount(totalGeneral.toFixed(2))}</span>
        </div>
      </div>
    </div>
  );
};
