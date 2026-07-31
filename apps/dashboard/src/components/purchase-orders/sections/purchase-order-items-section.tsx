"use client";

import {
  Controller,
  useFormContext,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { purchasingUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { PURCHASING_UNIT_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

const priceUnitOptions = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);

type Props = {
  productOptions: SelectOption[];
  itemFields: FieldArrayWithId<PurchaseOrderFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<PurchaseOrderFormValues, "items">;
  removeItem: UseFieldArrayRemove;
};

export const PurchaseOrderItemsSection = ({
  productOptions,
  itemFields,
  appendItem,
  removeItem,
}: Props) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Products</h2>

      {errors.items?.root && (
        <FormFieldError message={errors.items.root.message} />
      )}

      <div className="space-y-3">
        {itemFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_140px_140px_110px_32px] items-start gap-3"
          >
            <div>
              <FormLabel htmlFor={`items.${index}.productUuid`} required>
                Product
              </FormLabel>
              <Controller
                control={control}
                name={`items.${index}.productUuid`}
                render={({ field: productField }) => (
                  <Select
                    id={`items.${index}.productUuid`}
                    value={productField.value || ""}
                    options={productOptions}
                    onValueChange={productField.onChange}
                    invalid={!!errors.items?.[index]?.productUuid}
                  />
                )}
              />
              <FormFieldError
                message={errors.items?.[index]?.productUuid?.message}
              />
            </div>

            <div>
              <FormLabel htmlFor={`items.${index}.quantity`} required>
                Quantity
              </FormLabel>
              <Input
                id={`items.${index}.quantity`}
                type="number"
                step="0.001"
                min="0"
                {...register(`items.${index}.quantity`)}
              />
              <FormFieldError
                message={errors.items?.[index]?.quantity?.message}
              />
            </div>

            {/* The lot received against this line is valued at this price, so
                it decides the margin of every sales order drawn from it. */}
            <div>
              <FormLabel htmlFor={`items.${index}.netPrice`} required>
                Purchase price
              </FormLabel>
              <Input
                id={`items.${index}.netPrice`}
                type="number"
                step="0.0001"
                min="0"
                {...register(`items.${index}.netPrice`)}
              />
              <FormFieldError
                message={errors.items?.[index]?.netPrice?.message}
              />
            </div>

            <div>
              <FormLabel htmlFor={`items.${index}.priceUnit`}>Per</FormLabel>
              <Controller
                control={control}
                name={`items.${index}.priceUnit`}
                render={({ field: unitField }) => (
                  <Select
                    id={`items.${index}.priceUnit`}
                    value={unitField.value || ""}
                    options={priceUnitOptions}
                    onValueChange={unitField.onChange}
                  />
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          appendItem({
            productUuid: "",
            quantity: "",
            netPrice: "",
            priceUnit: "",
          })
        }
      >
        <Plus className="mr-1 size-3.5" /> Add product
      </Button>
    </section>
  );
};
