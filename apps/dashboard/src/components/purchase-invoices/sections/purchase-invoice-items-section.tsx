"use client";

import {
  Controller,
  useFormContext,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { PurchaseInvoiceFormValues } from "@/app/(dashboard)/purchase-invoices/validation";
import { ReceivablePurchaseOrderItem } from "@/app/(dashboard)/purchase-orders/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { Plus, X } from "lucide-react";

type Props = {
  receivableItems: ReceivablePurchaseOrderItem[];
  itemFields: FieldArrayWithId<PurchaseInvoiceFormValues, "items", "id">[];
  appendItem: UseFieldArrayAppend<PurchaseInvoiceFormValues, "items">;
  removeItem: UseFieldArrayRemove;
  isPending: boolean;
};

export const PurchaseInvoiceItemsSection = ({
  receivableItems,
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

  const orderLineOptions = [
    { value: "", label: "— Select —" },
    ...receivableItems.map((item) => ({
      value: item.uuid,
      label: `PO ${item.purchaseOrderId ?? "?"} · ${[item.productCode, item.productName].filter(Boolean).join(" — ")} (${item.remainingQuantity} to receive)`,
    })),
  ];

  if (receivableItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 lg:col-span-3">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Received Items
      </h2>

      <div className="space-y-3">
        {itemFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_160px_32px] items-start gap-3"
          >
            <div>
              <FormLabel htmlFor={`items.${index}.purchaseOrderItemUuid`} required>
                Order Line
              </FormLabel>
              <Controller
                control={control}
                name={`items.${index}.purchaseOrderItemUuid`}
                render={({ field: orderLineField }) => (
                  <Select
                    id={`items.${index}.purchaseOrderItemUuid`}
                    value={orderLineField.value || ""}
                    options={orderLineOptions}
                    onValueChange={orderLineField.onChange}
                    invalid={!!errors.items?.[index]?.purchaseOrderItemUuid}
                    disabled={isPending}
                  />
                )}
              />
              <FormFieldError
                message={errors.items?.[index]?.purchaseOrderItemUuid?.message}
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
        onClick={() => appendItem({ purchaseOrderItemUuid: "", quantity: "" })}
        disabled={isPending}
      >
        <Plus className="mr-1 size-3.5" /> Add received item
      </Button>
    </div>
  );
};
