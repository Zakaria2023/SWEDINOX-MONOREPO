"use client";

import { InvoiceFormValues } from "@/app/(dashboard)/invoices/validation";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { invoicePaymentTerms, invoiceVatScenarios } from "@/lib/enums";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";
import { Controller, useFormContext } from "react-hook-form";

type InvoiceSettingsSectionProps = {
  isPending: boolean;
};

export const InvoiceSettingsSection = ({
  isPending,
}: InvoiceSettingsSectionProps) => {
  const { register, control } = useFormContext<InvoiceFormValues>();

  const vatScenarioOptions = [
    { value: "", label: "Empty" },
    ...invoiceVatScenarios.map((v) => ({
      value: v,
      label: INVOICE_VAT_SCENARIO_LABELS[v],
    })),
  ];

  const paymentTermOptions = [
    { value: "", label: "Empty" },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t],
    })),
  ];

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
        Settings
      </h2>
      <div>
        <FormLabel>VAT Scenario</FormLabel>
        <Controller
          name="vatScenario"
          control={control}
          render={({ field }) => (
            <Select
              options={vatScenarioOptions}
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v || undefined)}
              disabled={isPending}
            />
          )}
        />
      </div>
      <div>
        <FormLabel>Payment Terms</FormLabel>
        <Controller
          name="paymentTerms"
          control={control}
          render={({ field }) => (
            <Select
              options={paymentTermOptions}
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v || undefined)}
              disabled={isPending}
            />
          )}
        />
      </div>
      <div>
        <FormLabel htmlFor="explanation">Explanation</FormLabel>
        <textarea
          id="explanation"
          {...register("explanation")}
          rows={6}
          disabled={isPending}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
};
