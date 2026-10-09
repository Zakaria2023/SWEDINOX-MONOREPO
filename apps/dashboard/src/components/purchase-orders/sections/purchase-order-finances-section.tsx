"use client";

import { useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { SelectOption } from "@/components/shadcn/select";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  paymentTermOptions: SelectOption[];
};

export const PurchaseOrderFinancesSection = ({ paymentTermOptions }: Props) => {
  const { control } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">Finances</h2>
      <div className="max-w-sm">
        <FormSelectField
          control={control}
          id="paymentTerms"
          name="paymentTerms"
          label="Payment Terms"
          options={paymentTermOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
