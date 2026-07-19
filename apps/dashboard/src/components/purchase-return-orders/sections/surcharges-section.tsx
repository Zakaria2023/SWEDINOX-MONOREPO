"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { PurchaseReturnOrderFormValues } from "@/app/(dashboard)/purchase-return-orders/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { contractTierUnits, invoiceSurchargeDescriptions } from "@/lib/enums";
import {
  COMMON_TEXT,
  CONTRACT_TIER_UNIT_LABELS,
  INVOICE_SURCHARGE_DESCRIPTION_LABELS,
} from "@/lib/labels";

type Props = {
  companyOptions: SelectOption[];
};

const descriptionOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...invoiceSurchargeDescriptions.map((description) => ({
    value: description,
    label: INVOICE_SURCHARGE_DESCRIPTION_LABELS[description],
  })),
];

const tierUnitOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...contractTierUnits.map((unit) => ({
    value: unit,
    label: CONTRACT_TIER_UNIT_LABELS[unit],
  })),
];

const EMPTY_SURCHARGE = {
  description: "" as const,
  surcharge: "0.00",
  unit: "",
  fromValue: "0.00",
  unitIndication: "",
  tierUnit: "" as const,
  amount: "0.00",
  profit: "0.00",
  thirdParties: false,
  companyCode: "",
  companyUuid: "",
};

export const SurchargesSection = ({ companyOptions }: Props) => {
  const { control, register } = useFormContext<PurchaseReturnOrderFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "surcharges",
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
              <FormSelectField
                control={control}
                id={`surcharges.${index}.description`}
                name={`surcharges.${index}.description`}
                label="Description"
                options={descriptionOptions}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`surcharges.${index}.surcharge`}>
                  Surcharge
                </FormLabel>
                <Input
                  id={`surcharges.${index}.surcharge`}
                  inputMode="decimal"
                  {...register(`surcharges.${index}.surcharge`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surcharges.${index}.unit`}>Unit</FormLabel>
                <Input
                  id={`surcharges.${index}.unit`}
                  {...register(`surcharges.${index}.unit`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surcharges.${index}.fromValue`}>
                  From
                </FormLabel>
                <Input
                  id={`surcharges.${index}.fromValue`}
                  inputMode="decimal"
                  {...register(`surcharges.${index}.fromValue`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surcharges.${index}.unitIndication`}>
                  U/i
                </FormLabel>
                <Input
                  id={`surcharges.${index}.unitIndication`}
                  {...register(`surcharges.${index}.unitIndication`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`surcharges.${index}.tierUnit`}
                name={`surcharges.${index}.tierUnit`}
                label="Tier unit"
                options={tierUnitOptions}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`surcharges.${index}.amount`}>
                  Amount
                </FormLabel>
                <Input
                  id={`surcharges.${index}.amount`}
                  inputMode="decimal"
                  {...register(`surcharges.${index}.amount`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surcharges.${index}.profit`}>
                  Profit
                </FormLabel>
                <Input
                  id={`surcharges.${index}.profit`}
                  inputMode="decimal"
                  {...register(`surcharges.${index}.profit`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`surcharges.${index}.companyCode`}>
                  Company code
                </FormLabel>
                <Input
                  id={`surcharges.${index}.companyCode`}
                  {...register(`surcharges.${index}.companyCode`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`surcharges.${index}.companyUuid`}
                name={`surcharges.${index}.companyUuid`}
                label="Company"
                options={companyOptions}
                emptyValue=""
              />
              <div className="flex items-end">
                <Controller
                  control={control}
                  name={`surcharges.${index}.thirdParties`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      className="w-full"
                      label="Third parties"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
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
