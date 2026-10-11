"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ReturnOrderFormValues } from "@/app/(dashboard)/return-orders/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

// The reference's `Finances` switches on a sales document, in its order. The
// ones with no column on a return carry no field name and are shown greyed.
const FINANCE_SWITCHES = [
  [null, "Show net price"],
  [null, "Scrap surcharge separately"],
  ["calculateVatIfApplicable", "Calculate VAT if applicable"],
  [null, "Financial blockage"],
  ["invoiceBlockage", "Invoice blockage"],
  ["onlyTotalAmountOnInvoice", "Only total amount on invoice"],
  [
    "includeOptionPricesInMaterialPrices",
    "Include option prices in material prices",
  ],
] as const;

type Props = {
  paymentTermOptions: SelectOption[];
  /** The customer's own addresses — what the return is billed to. */
  addressOptions: SelectOption[];
};

/**
 * The `Finances` panel, as on the sales order (order 100742, 18-9-2026):
 * payment terms, billing address, the blockages and their reason. `Show net
 * price`, `Scrap surcharge separately` and `Financial blockage` have no column
 * on a return, so they are shown greyed.
 */
export const FinancesSection = ({
  paymentTermOptions,
  addressOptions,
}: Props) => {
  const { control, register } = useFormContext<ReturnOrderFormValues>();

  return (
    <CollapsibleSection title="Finances">
      <div className="space-y-4 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {FINANCE_SWITCHES.map(([name, label]) =>
            name ? (
              <Controller
                key={label}
                control={control}
                name={name}
                render={({ field }) => (
                  <FormCheckboxCard
                    label={label}
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            ) : (
              <FormCheckboxCard
                key={label}
                label={label}
                checked={false}
                disabled
                readOnly
                className="cursor-not-allowed opacity-60"
              />
            ),
          )}
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
    </CollapsibleSection>
  );
};
