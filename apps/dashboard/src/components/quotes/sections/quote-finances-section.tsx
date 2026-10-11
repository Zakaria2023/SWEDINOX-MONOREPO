"use client";

import { Controller, useFormContext } from "react-hook-form";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  paymentTermOptions: SelectOption[];
  addressOptions: SelectOption[];
};

type FinanceFlag =
  | "showNetPrice"
  | "scrapSurchargeSeparate"
  | "calculateVatIfApplicable"
  | "financialBlockage"
  | "onlyTotalAmountOnInvoice"
  | "doNotShowTotalAmount"
  | "includeOptionPricesInMaterialPrices";

const FINANCE_FLAGS: ReadonlyArray<[FinanceFlag, string]> = [
  ["showNetPrice", "Show net price"],
  ["scrapSurchargeSeparate", "Scrap surcharge separately"],
  ["calculateVatIfApplicable", "Calculate VAT if applicable"],
  ["financialBlockage", "Financial blockage"],
  ["onlyTotalAmountOnInvoice", "Only total amount on invoice"],
  ["doNotShowTotalAmount", "Do not show total amount"],
  [
    "includeOptionPricesInMaterialPrices",
    "Include option prices in material prices",
  ],
];

/**
 * The reference's `Finances` panel (order 100742, 18-9-2026): the payment
 * terms, the switches that decide how the money is printed, the billing
 * address and the blocking reason.
 */
export const QuoteFinancesSection = ({
  paymentTermOptions,
  addressOptions,
}: Props) => {
  const { register, control } = useFormContext<QuoteFormValues>();

  return (
    <div className="space-y-4">
      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {FINANCE_FLAGS.map(([name, label]) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                {label}
              </label>
            )}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormSelectField
          control={control}
          id="paymentTerms"
          name="paymentTerms"
          label="Payment terms"
          options={paymentTermOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="billingAddressUuid"
          name="billingAddressUuid"
          label="Billing address"
          options={addressOptions}
          emptyValue=""
          disabled={addressOptions.length <= 1}
        />

        <div>
          <FormLabel htmlFor="blockingReason">Blocking reason</FormLabel>
          <Input id="blockingReason" {...register("blockingReason")} />
        </div>
      </div>
    </div>
  );
};
