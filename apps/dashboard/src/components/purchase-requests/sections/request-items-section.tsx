"use client";

import {
  Control,
  Controller,
  UseFormRegister,
  type FieldArrayWithId,
} from "react-hook-form";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { stockUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

const unitOptions = enumOptions(stockUnits, STOCK_UNIT_LABELS);

type Props = {
  productOptions: SelectOption[];
  control: Control<PurchaseRequestFormValues>;
  register: UseFormRegister<PurchaseRequestFormValues>;
  itemFields: FieldArrayWithId<PurchaseRequestFormValues, "items", "id">[];
  appendItem: () => void;
  removeItem: (index: number) => void;
};

export const RequestItemsSection = ({
  productOptions,
  control,
  register,
  itemFields,
  appendItem,
  removeItem,
}: Props) => (
  <section className="space-y-4">
    <div className="border-b pb-2">
      <h2 className="text-base font-semibold">What are you asking for?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These lines are sent to every supplier you ask, without prices — each
        one quotes against the same list, which is what makes their answers
        comparable.
      </p>
    </div>

    <div className="space-y-3">
      {itemFields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-[1fr_110px_100px_110px_140px_32px] items-start gap-3"
        >
          <div>
            <FormLabel htmlFor={`items.${index}.productUuid`}>
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
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor={`items.${index}.quantity`}>Quantity</FormLabel>
            <Input
              id={`items.${index}.quantity`}
              type="number"
              step="0.001"
              min="0"
              {...register(`items.${index}.quantity`)}
            />
          </div>

          <div>
            <FormLabel htmlFor={`items.${index}.unit`}>Unit</FormLabel>
            <Controller
              control={control}
              name={`items.${index}.unit`}
              render={({ field: unitField }) => (
                <Select
                  id={`items.${index}.unit`}
                  value={unitField.value || ""}
                  options={unitOptions}
                  onValueChange={unitField.onChange}
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor={`items.${index}.lengthMm`}>
              Length (mm)
            </FormLabel>
            <Input
              id={`items.${index}.lengthMm`}
              type="number"
              min="0"
              {...register(`items.${index}.lengthMm`)}
            />
          </div>

          <div>
            <FormLabel htmlFor={`items.${index}.requiredDate`}>
              Required by
            </FormLabel>
            <Input
              id={`items.${index}.requiredDate`}
              type="date"
              {...register(`items.${index}.requiredDate`)}
            />
          </div>

          <button
            type="button"
            onClick={() => removeItem(index)}
            className="mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </button>

          {/* A request can name something that isn't on the product list yet —
              that's a normal way for a new product to enter the system. */}
          <div className="col-span-5">
            <Input
              placeholder="Description (use this when the product isn't listed yet)"
              {...register(`items.${index}.description`)}
            />
          </div>
        </div>
      ))}
    </div>

    <Button type="button" variant="outline" size="sm" onClick={appendItem}>
      <Plus className="mr-1 size-3.5" /> Add line
    </Button>
  </section>
);
