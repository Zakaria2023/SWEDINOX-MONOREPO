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
import { orderSourceTypes } from "@/lib/enums";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";
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
    watch,
    formState: { errors },
  } = useFormContext<OrderFormValues>();

  const lines = watch("items") ?? [];

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
            className="grid grid-cols-[1fr_auto_140px_160px_32px] items-start gap-3"
          >
            <div>
              <FormLabel htmlFor={`items.${index}.stockUuid`} required>
                {lines[index]?.sourceType === "cross_dock"
                  ? "Article to buy"
                  : "Stock Item"}
              </FormLabel>
              {/* A `CD` line has no lot yet — it names the article that will
                  be bought for it, chosen in the search window. */}
              {lines[index]?.sourceType === "cross_dock" ? (
                <Input
                  id={`items.${index}.stockUuid`}
                  value={lines[index]?.productLabel ?? ""}
                  placeholder="Search the catalogue"
                  readOnly
                />
              ) : (
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
              )}
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

            {/* The reference's line `Type`: where this line's metal comes
                from, and so which of the product's margin floors holds it. */}
            <div>
              <FormLabel htmlFor={`items.${index}.sourceType`}>Type</FormLabel>
              <Controller
                control={control}
                name={`items.${index}.sourceType`}
                render={({ field: typeField }) => (
                  <Select
                    id={`items.${index}.sourceType`}
                    value={typeField.value || "stock"}
                    options={orderSourceTypes.map((type) => ({
                      value: type,
                      label: ORDER_SOURCE_TYPE_LABELS[type],
                    }))}
                    onValueChange={(next) => {
                      typeField.onChange(next);
                      // Switching between a lot and an article starts the
                      // line's product over.
                      setValue(`items.${index}.stockUuid`, "");
                      setValue(`items.${index}.productUuid`, "");
                      setValue(`items.${index}.productLabel`, "");
                    }}
                  />
                )}
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
            stockUuid: "",
            productUuid: "",
            productLabel: "",
            quantity: "",
            sourceType: "stock",
          })
        }
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
        // A `CD` line buys its metal, so it searches the catalogue like any
        // buying document, and takes the article rather than a lot.
        sources={
          searchingLine !== null &&
          lines[searchingLine]?.sourceType === "cross_dock"
            ? ["catalogue"]
            : undefined
        }
        productOnly={
          searchingLine !== null &&
          lines[searchingLine]?.sourceType === "cross_dock"
        }
        onChoose={(choice) => {
          if (searchingLine === null) {
            return;
          }
          if (lines[searchingLine]?.sourceType === "cross_dock") {
            const variant =
              choice.kind === "variant" ? choice.variant : choice.lot;
            setValue(`items.${searchingLine}.stockUuid`, "");
            setValue(`items.${searchingLine}.productUuid`, variant.productUuid, {
              shouldValidate: true,
            });
            setValue(
              `items.${searchingLine}.productLabel`,
              [variant.productCode, variant.productName]
                .filter(Boolean)
                .join(" — "),
            );
            setSearchingLine(null);
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
