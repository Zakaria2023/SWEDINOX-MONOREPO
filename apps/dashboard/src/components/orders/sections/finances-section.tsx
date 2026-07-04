"use client";

import { Controller, useFormContext } from "react-hook-form";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { SelectOption } from "@/components/shadcn/select";

type Props = {
  addressOptions: SelectOption[];
  paymentTermOptions: SelectOption[];
};

export const FinancesSection = ({ addressOptions, paymentTermOptions }: Props) => {
  const { register, control } = useFormContext<OrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Finances</h2>

      <div className="grid grid-cols-3 gap-3">
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

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="paymentTerms"
          name="paymentTerms"
          label="Payment Terms"
          options={paymentTermOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="billingAddressUuid"
          name="billingAddressUuid"
          label="Billing Address"
          options={addressOptions}
          emptyValue=""
          disabled={addressOptions.length <= 1}
        />

        <div>
          <FormLabel htmlFor="blockingReason">Blocking Reason</FormLabel>
          <Input id="blockingReason" {...register("blockingReason")} />
        </div>
      </div>
    </section>
  );
};
