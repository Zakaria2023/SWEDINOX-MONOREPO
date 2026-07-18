"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { invoicePaymentTerms } from "@/lib/enums";
import { COMMON_TEXT, INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";

type Props = {
  addressOptions: SelectOption[];
};

const paymentTermOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...invoicePaymentTerms.map((term) => ({
    value: term,
    label: INVOICE_PAYMENT_TERM_LABELS[term],
  })),
];

export const FinancesSection = ({ addressOptions }: Props) => {
  const { register, control } = useFormContext<CounterOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Finances
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Controller
          control={control}
          name="showNetPrice"
          render={({ field }) => (
            <FormCheckboxCard
              label="Show net price"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="scrapSurchargeSeparate"
          render={({ field }) => (
            <FormCheckboxCard
              label="Scrap surcharge separately"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="calculateVatIfApplicable"
          render={({ field }) => (
            <FormCheckboxCard
              label="Calculate VAT if applicable"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="financialBlockage"
          render={({ field }) => (
            <FormCheckboxCard
              label="Financial blockage"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="invoiceBlockage"
          render={({ field }) => (
            <FormCheckboxCard
              label="Invoice blockage"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="onlyTotalAmountOnInvoice"
          render={({ field }) => (
            <FormCheckboxCard
              label="Only total amount on invoice"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="includeOptionPricesInMaterialPrices"
          render={({ field }) => (
            <FormCheckboxCard
              label="Include option prices in material prices"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    </section>
  );
};
