"use client";

import {
  Controller,
  useFormContext,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { useState } from "react";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { StockSearchDialog } from "@/components/orders/stock-search-dialog";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { Plus, Search, X } from "lucide-react";

type Props = {
  stockOptions: SelectOption[];
  itemFields: FieldArrayWithId<OrderFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<OrderFormValues, "items">;
  removeItem: UseFieldArrayRemove;
};

export const OrderItemsSection = ({
  stockOptions,
  itemFields,
  appendItem,
  removeItem,
}: Props) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<OrderFormValues>();

  // Which line the search window was opened for, or null when it is shut.
  const [searchingLine, setSearchingLine] = useState<number | null>(null);

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Products</h2>
      <p className="text-sm text-muted-foreground">
        Reserving a product here holds it from available stock — it
        isn&apos;t removed from the warehouse until it&apos;s invoiced.
      </p>

      {errors.items?.root && (
        <FormFieldError message={errors.items.root.message} />
      )}

      <div className="space-y-3">
        {itemFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_auto_160px_32px] items-start gap-3"
          >
            <div>
              <FormLabel htmlFor={`items.${index}.stockUuid`} required>
                Stock Item
              </FormLabel>
              <Controller
                control={control}
                name={`items.${index}.stockUuid`}
                render={({ field: stockField }) => (
                  <Select
                    id={`items.${index}.stockUuid`}
                    value={stockField.value || ""}
                    options={stockOptions}
                    onValueChange={stockField.onChange}
                    invalid={!!errors.items?.[index]?.stockUuid}
                  />
                )}
              />
              <FormFieldError
                message={errors.items?.[index]?.stockUuid?.message}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={() => setSearchingLine(index)}
            >
              <Search className="size-4" />
              Search
            </Button>

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
        onClick={() => appendItem({ stockUuid: "", quantity: "" })}
      >
        <Plus className="mr-1 size-3.5" /> Add product
      </Button>

      {/* The reference enters every line through this window rather than a
          dropdown, and it is the only way to reach a lot that is not in the
          first few hundred. `Use selected product` is accepted here as the lot
          with the most available of that article: our order line must name a
          lot, because the reservation it writes binds one. */}
      <StockSearchDialog
        open={searchingLine !== null}
        onOpenChange={(open) => setSearchingLine(open ? searchingLine : null)}
        onChoose={(choice) => {
          if (searchingLine === null) {
            return;
          }
          if (choice.lot) {
            setValue(`items.${searchingLine}.stockUuid`, choice.lot.uuid, {
              shouldValidate: true,
            });
          }
          setSearchingLine(null);
        }}
      />
    </section>
  );
};
