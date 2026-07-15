"use client";

import {
  Controller,
  useFormContext,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { PendingStockOption } from "@/app/(dashboard)/stock/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { Plus, X } from "lucide-react";

type Props = {
  pendingStock: PendingStockOption[];
  itemFields: FieldArrayWithId<PurchaseInvoiceFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<PurchaseInvoiceFormValues, "items">;
  removeItem: UseFieldArrayRemove;
  isPending: boolean;
};

export const PurchaseInvoiceItemsSection = ({
  pendingStock,
  itemFields,
  appendItem,
  removeItem,
  isPending,
}: Props) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<PurchaseInvoiceFormValues>();

  const stockOptions = [
    { value: "", label: "— Select —" },
    ...pendingStock.map((s) => ({
      value: s.uuid,
      label: `${[s.productCode, s.productName].filter(Boolean).join(" — ")} (${s.quantity} available)`,
    })),
  ];

  if (pendingStock.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 lg:col-span-3">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Stock Items
      </h2>

      <div className="space-y-3">
        {itemFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_160px_32px] items-start gap-3"
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
                    disabled={isPending}
                  />
                )}
              />
              <FormFieldError
                message={errors.items?.[index]?.stockUuid?.message}
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
                disabled={isPending}
              />
              <FormFieldError
                message={errors.items?.[index]?.quantity?.message}
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
              disabled={isPending}
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
        disabled={isPending}
      >
        <Plus className="mr-1 size-3.5" /> Add stock item
      </Button>
    </div>
  );
};
