"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  EMPTY_SUPPLIER,
  ProductGroupFormValues,
} from "@/app/(dashboard)/product-groups/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { deliveryTimeUnits, purchasingUnits } from "@/lib/enums";
import { DELIVERY_TIME_UNIT_LABELS, PURCHASING_UNIT_LABELS } from "@/lib/labels";

type Props = {
  supplierOptions: { value: string; label: string }[];
};

const emptyOption = { value: "", label: "Empty" };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const deliveryTimeUnitOptions = makeEnumOptions(
  deliveryTimeUnits,
  DELIVERY_TIME_UNIT_LABELS,
);
const purchasingUnitOptions = makeEnumOptions(
  purchasingUnits,
  PURCHASING_UNIT_LABELS,
);

export const SupplierSection = ({ supplierOptions }: Props) => {
  const { control, register, getValues, setValue } =
    useFormContext<ProductGroupFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "suppliers",
  });

  // Exactly one supplier may be preferred — checking one clears the rest.
  const setPreferred = (index: number, checked: boolean) => {
    const suppliers = getValues("suppliers");
    suppliers.forEach((_, i) => {
      setValue(`suppliers.${i}.preferred`, checked && i === index);
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Suppliers
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(EMPTY_SUPPLIER)}
        >
          <Plus className="mr-1" />
          New
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No suppliers yet. Use “New” to add one.
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={getValues(`suppliers.${index}.preferred`)}
                    onChange={(e) => setPreferred(index, e.target.checked)}
                  />
                  <span className="text-sm font-medium">Preferred</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="mr-1" />
                  Delete
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelectField
                  id={`suppliers.${index}.supplierCompanyUuid`}
                  name={`suppliers.${index}.supplierCompanyUuid`}
                  control={control}
                  label="Supplier"
                  options={supplierOptions}
                  emptyValue=""
                  required
                />
                <div>
                  <FormLabel htmlFor={`suppliers.${index}.ean`}>EAN</FormLabel>
                  <Input
                    id={`suppliers.${index}.ean`}
                    {...register(`suppliers.${index}.ean`)}
                  />
                </div>
                <div>
                  <FormLabel htmlFor={`suppliers.${index}.externalProductCode`}>
                    External Product Code
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
                    Delivery Time
                  </FormLabel>
                  <Input
                    id={`suppliers.${index}.deliveryTime`}
                    type="number"
                    min={0}
                    {...register(`suppliers.${index}.deliveryTime`, {
                      setValueAs: (v) => (v === "" ? 0 : Number(v)),
                    })}
                  />
                </div>
                <FormSelectField
                  id={`suppliers.${index}.deliveryTimeUnit`}
                  name={`suppliers.${index}.deliveryTimeUnit`}
                  control={control}
                  label="Delivery Time Unit"
                  options={deliveryTimeUnitOptions}
                  emptyValue=""
                />
                <div>
                  <FormLabel htmlFor={`suppliers.${index}.moq`}>MOQ</FormLabel>
                  <Input
                    id={`suppliers.${index}.moq`}
                    {...register(`suppliers.${index}.moq`)}
                  />
                </div>
                <FormSelectField
                  id={`suppliers.${index}.moqUnit`}
                  name={`suppliers.${index}.moqUnit`}
                  control={control}
                  label="MOQ Unit"
                  options={purchasingUnitOptions}
                  emptyValue=""
                />
                <div>
                  <FormLabel htmlFor={`suppliers.${index}.orderSeries`}>
                    Order Series
                  </FormLabel>
                  <Input
                    id={`suppliers.${index}.orderSeries`}
                    type="number"
                    min={0}
                    {...register(`suppliers.${index}.orderSeries`, {
                      setValueAs: (v) => (v === "" ? 0 : Number(v)),
                    })}
                  />
                </div>
                <FormSelectField
                  id={`suppliers.${index}.orderSeriesUnit`}
                  name={`suppliers.${index}.orderSeriesUnit`}
                  control={control}
                  label="Order Series Unit"
                  options={purchasingUnitOptions}
                  emptyValue=""
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
