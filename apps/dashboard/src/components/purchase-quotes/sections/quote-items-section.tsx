"use client";

import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFormRegister,
} from "react-hook-form";
import { PurchaseQuoteFormValues } from "@/app/(dashboard)/purchase-quotes/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { purchasingUnits, stockUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { PURCHASING_UNIT_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { Plus, X } from "lucide-react";

const unitOptions = enumOptions(stockUnits, STOCK_UNIT_LABELS);
const priceUnitOptions = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);

type Props = {
  control: Control<PurchaseQuoteFormValues>;
  register: UseFormRegister<PurchaseQuoteFormValues>;
  itemFields: FieldArrayWithId<PurchaseQuoteFormValues, "items", "id">[];
  appendItem: () => void;
  removeItem: (index: number) => void;
};

export const QuoteItemsSection = ({
  control,
  register,
  itemFields,
  appendItem,
  removeItem,
}: Props) => (
  <section className="space-y-4">
    <div className="border-b pb-2">
      <h2 className="text-base font-semibold">Lines</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What the supplier quotes. Leave Kg empty to have it worked out from the
        product. Enter a gross price with its discounts, or a net price
        directly — a gross price wins.
      </p>
    </div>

    <div className="space-y-3">
      {itemFields.map((field, index) => (
        <div key={field.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <FormLabel htmlFor={`items.${index}.productUuid`}>
                Product
              </FormLabel>
              <Controller
                control={control}
                name={`items.${index}.productUuid`}
                render={({ field: productField }) => (
                  <ProductSearchField
                    id={`items.${index}.productUuid`}
                    value={productField.value || ""}
                    sources={["catalogue", "purchase"]}
                    onChange={(choice) =>
                      productField.onChange(choice.productUuid)
                    }
                  />
                )}
              />
            </div>
            <div className="flex-1">
              <FormLabel htmlFor={`items.${index}.description`}>
                Description
              </FormLabel>
              <Input
                id={`items.${index}.description`}
                placeholder="When the product isn't listed yet"
                {...register(`items.${index}.description`)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label="Remove line"
              className="mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
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
              <FormLabel htmlFor={`items.${index}.unit`}>QtyU</FormLabel>
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
              <FormLabel htmlFor={`items.${index}.widthMm`}>
                Width (mm)
              </FormLabel>
              <Input
                id={`items.${index}.widthMm`}
                type="number"
                min="0"
                {...register(`items.${index}.widthMm`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.thicknessMm`}>
                Thickness (mm)
              </FormLabel>
              <Input
                id={`items.${index}.thicknessMm`}
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.thicknessMm`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.kg`}>Kg</FormLabel>
              <Input
                id={`items.${index}.kg`}
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.kg`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.grossPrice`}>
                Gross price
              </FormLabel>
              <Input
                id={`items.${index}.grossPrice`}
                type="number"
                step="0.0001"
                min="0"
                {...register(`items.${index}.grossPrice`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.groupDiscountPercent`}>
                Group discount %
              </FormLabel>
              <Input
                id={`items.${index}.groupDiscountPercent`}
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.groupDiscountPercent`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.lineDiscountPercent`}>
                Line discount %
              </FormLabel>
              <Input
                id={`items.${index}.lineDiscountPercent`}
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.lineDiscountPercent`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.netPrice`}>
                Net price
              </FormLabel>
              <Input
                id={`items.${index}.netPrice`}
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.netPrice`)}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.priceUnit`}>PriceU</FormLabel>
              <Controller
                control={control}
                name={`items.${index}.priceUnit`}
                render={({ field: priceUnitField }) => (
                  <Select
                    id={`items.${index}.priceUnit`}
                    value={priceUnitField.value || ""}
                    options={priceUnitOptions}
                    onValueChange={priceUnitField.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor={`items.${index}.internalText`}>
                Internal text
              </FormLabel>
              <Input
                id={`items.${index}.internalText`}
                {...register(`items.${index}.internalText`)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>

    <Button type="button" variant="outline" size="sm" onClick={appendItem}>
      <Plus className="mr-1 size-3.5" /> Add line
    </Button>
  </section>
);
