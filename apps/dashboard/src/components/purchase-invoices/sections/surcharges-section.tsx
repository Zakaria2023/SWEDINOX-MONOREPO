"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { invoiceSurchargeDescriptions } from "@/lib/enums";
import {
  COMMON_TEXT,
  INVOICE_SURCHARGE_DESCRIPTION_LABELS,
} from "@/lib/labels";

const descriptionOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...invoiceSurchargeDescriptions.map((description) => ({
    value: description,
    label: INVOICE_SURCHARGE_DESCRIPTION_LABELS[description],
  })),
];

const EMPTY_SURCHARGE = {
  booked: false,
  orderRef: "",
  description: "" as const,
  revenueGroup: "",
  surcharge: "0.00",
  unit: "",
  surchargeBasis: "0.00",
  amount: "0.00",
  vatRate: "",
};

export const SurchargesSection = () => {
  const { control, register } = useFormContext<PurchaseInvoiceFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "surchargeLines",
  });

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Surcharges</h2>
      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Surcharge {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove surcharge"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-end">
                <Controller
                  control={control}
                  name={`surchargeLines.${index}.booked`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      className="w-full"
                      label="Booked"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.orderRef`}>
                  Order
                </FormLabel>
                <Input
                  id={`surchargeLines.${index}.orderRef`}
                  {...register(`surchargeLines.${index}.orderRef`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`surchargeLines.${index}.description`}
                name={`surchargeLines.${index}.description`}
                label="Description"
                options={descriptionOptions}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.revenueGroup`}>
                  Omzetgroep
                </FormLabel>
                <Input
                  id={`surchargeLines.${index}.revenueGroup`}
                  {...register(`surchargeLines.${index}.revenueGroup`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.surcharge`}>
                  Surcharge
                </FormLabel>
                <Input
                  id={`surchargeLines.${index}.surcharge`}
                  inputMode="decimal"
                  {...register(`surchargeLines.${index}.surcharge`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.unit`}>U</FormLabel>
                <Input
                  id={`surchargeLines.${index}.unit`}
                  {...register(`surchargeLines.${index}.unit`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.surchargeBasis`}>
                  Surcharge basis
                </FormLabel>
                <Input
                  id={`surchargeLines.${index}.surchargeBasis`}
                  inputMode="decimal"
                  {...register(`surchargeLines.${index}.surchargeBasis`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.amount`}>
                  Amount
                </FormLabel>
                <Input
                  id={`surchargeLines.${index}.amount`}
                  inputMode="decimal"
                  {...register(`surchargeLines.${index}.amount`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surchargeLines.${index}.vatRate`}>
                  VAT rate
                </FormLabel>
                <Input
                  id={`surchargeLines.${index}.vatRate`}
                  inputMode="decimal"
                  {...register(`surchargeLines.${index}.vatRate`)}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append(EMPTY_SURCHARGE)}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          Add surcharge
        </button>
      </div>
    </section>
  );
};
