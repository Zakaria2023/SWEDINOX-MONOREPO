"use client";

import { Plus, X } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { deliveryTimeUnits, purchasingUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { DELIVERY_TIME_UNIT_LABELS, PURCHASING_UNIT_LABELS } from "@/lib/labels";

type Props = {
  supplierOptions: SelectOption[];
};

const purchasingUnitOpts = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);
const deliveryTimeUnitOpts = enumOptions(
  deliveryTimeUnits,
  DELIVERY_TIME_UNIT_LABELS,
);

const EMPTY_SUPPLIER = {
  supplierUuid: "",
  preferred: false,
  ean: "",
  externalProductCode: "",
  editing: "",
  deliveryTime: "0",
  deliveryTimeUnit: "" as const,
  minOrderQty: "0.000",
  minOrderQtyUnit: "" as const,
  orderSeries: "0.000",
  orderSeriesUnit: "" as const,
};

// Who this article can be bought from, and on what terms. One row is normally
// flagged preferred — that is the supplier the order advice adopts.
export const SuppliersSection = ({ supplierOptions }: Props) => {
  const { control, register } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "suppliers",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-base font-semibold">Suppliers</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} {fields.length === 1 ? "supplier" : "suppliers"}
        </span>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Supplier {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="cursor-pointer text-muted-foreground hover:text-destructive"
                aria-label={`Delete supplier ${index + 1}`}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormSelectField
                control={control}
                id={`suppliers.${index}.supplierUuid`}
                name={`suppliers.${index}.supplierUuid`}
                label="Supplier"
                options={supplierOptions}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`suppliers.${index}.ean`}>EAN</FormLabel>
                <Input
                  id={`suppliers.${index}.ean`}
                  {...register(`suppliers.${index}.ean`)}
                />
              </div>
              <div>
                <FormLabel
                  htmlFor={`suppliers.${index}.externalProductCode`}
                >
                  External product code
                </FormLabel>
                <Input
                  id={`suppliers.${index}.externalProductCode`}
                  {...register(`suppliers.${index}.externalProductCode`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`suppliers.${index}.editing`}>
                  Editing
                </FormLabel>
                <Input
                  id={`suppliers.${index}.editing`}
                  {...register(`suppliers.${index}.editing`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`suppliers.${index}.deliveryTime`}>
                  Delivery time
                </FormLabel>
                <Input
                  id={`suppliers.${index}.deliveryTime`}
                  type="number"
                  {...register(`suppliers.${index}.deliveryTime`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`suppliers.${index}.deliveryTimeUnit`}
                name={`suppliers.${index}.deliveryTimeUnit`}
                label="Delivery time unit"
                options={deliveryTimeUnitOpts}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`suppliers.${index}.minOrderQty`}>
                  M.O.Q.
                </FormLabel>
                <Input
                  id={`suppliers.${index}.minOrderQty`}
                  inputMode="decimal"
                  {...register(`suppliers.${index}.minOrderQty`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`suppliers.${index}.minOrderQtyUnit`}
                name={`suppliers.${index}.minOrderQtyUnit`}
                label="M.O.Q. unit"
                options={purchasingUnitOpts}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`suppliers.${index}.orderSeries`}>
                  Order series
                </FormLabel>
                <Input
                  id={`suppliers.${index}.orderSeries`}
                  inputMode="decimal"
                  {...register(`suppliers.${index}.orderSeries`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`suppliers.${index}.orderSeriesUnit`}
                name={`suppliers.${index}.orderSeriesUnit`}
                label="Order series unit"
                options={purchasingUnitOpts}
                emptyValue=""
              />
              <div className="flex items-end">
                <Controller
                  control={control}
                  name={`suppliers.${index}.preferred`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      className="w-full"
                      label="Preferred"
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
          onClick={() => append(EMPTY_SUPPLIER)}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          New supplier
        </button>
      </div>
    </section>
  );
};
