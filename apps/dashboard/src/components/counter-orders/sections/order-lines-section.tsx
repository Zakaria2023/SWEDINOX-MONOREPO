"use client";

import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductPickerDialog } from "@/components/companies/dialogs/product-picker-dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError } from "@/components/ui/form-field";
import { ORDER_LINE_STATUS_LABELS } from "@/lib/labels";
import { orderLineStatuses, stockUnits } from "@/lib/enums";
import { Plus, X } from "lucide-react";

type Props = {
  products: ProductOption[];
  productGroups: ProductGroupOption[];
};

const statusOptions = orderLineStatuses.map((status) => ({
  value: status,
  label: ORDER_LINE_STATUS_LABELS[status],
}));

const unitOptions = stockUnits.map((unit) => ({ value: unit, label: unit }));

// Columns kept editable on the counter-order line grid (derived figures like
// profit are computed for display, not entered, so they are omitted here).
const NUMERIC_FIELDS = [
  { name: "qtyPlanned", label: "Qty (p)", step: "0.001" },
  { name: "qtyActual", label: "Qty (a)", step: "0.001" },
  { name: "lengthMm", label: "Length (mm)", step: "1" },
  { name: "kgPlanned", label: "Kg (p)", step: "0.01" },
  { name: "kgActual", label: "Kg (a)", step: "0.01" },
  { name: "grossPrice", label: "Gross price", step: "0.01" },
  { name: "lineDiscount", label: "Line discount %", step: "0.01" },
  { name: "groupDiscount", label: "Group discount %", step: "0.01" },
  { name: "netPrice", label: "Net price", step: "0.01" },
  { name: "amount", label: "Amount", step: "0.01" },
] as const;

export const OrderLinesSection = ({ products, productGroups }: Props) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CounterOrderFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const handleAdd = () =>
    append({
      productUuid: "",
      productLabel: "",
      status: "in_progress",
      deliveryDate: "",
      description: "",
      levCode: "",
      reference: "",
      unit: "st",
      qtyPlanned: "0",
      qtyActual: "0",
      lengthMm: "",
      kgPlanned: "0",
      kgActual: "0",
      grossPrice: "0.00",
      lineDiscount: "0.00",
      groupDiscount: "0.00",
      netPrice: "0.00",
      amount: "0.00",
    });

  const handleSelectProduct = (product: ProductOption) => {
    if (pickerIndex === null) {
      return;
    }
    setValue(`items.${pickerIndex}.productUuid`, product.uuid);
    setValue(
      `items.${pickerIndex}.productLabel`,
      [product.productCode, product.name].filter(Boolean).join(" — "),
    );
    if (product.name) {
      setValue(`items.${pickerIndex}.description`, product.name);
    }
    setPickerIndex(null);
  };

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Order lines
      </h2>

      {errors.items?.root && (
        <FormFieldError message={errors.items.root.message} />
      )}

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No order lines yet.</p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Product
                  </label>
                  <div className="flex gap-2">
                    <Controller
                      control={control}
                      name={`items.${index}.productLabel`}
                      render={({ field: labelField }) => (
                        <Input
                          readOnly
                          placeholder="No product selected"
                          value={labelField.value ?? ""}
                          className="flex-1"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPickerIndex(index)}
                    >
                      Select…
                    </Button>
                  </div>
                  <FormFieldError
                    message={errors.items?.[index]?.productUuid?.message}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-6 flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                  aria-label="Remove line"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Controller
                    control={control}
                    name={`items.${index}.status`}
                    render={({ field: statusField }) => (
                      <Select
                        value={statusField.value}
                        options={statusOptions}
                        onValueChange={statusField.onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Unit
                  </label>
                  <Controller
                    control={control}
                    name={`items.${index}.unit`}
                    render={({ field: unitField }) => (
                      <Select
                        value={unitField.value}
                        options={unitOptions}
                        onValueChange={unitField.onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Delivery date
                  </label>
                  <Input
                    type="date"
                    {...register(`items.${index}.deliveryDate`)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    LevCode
                  </label>
                  <Input {...register(`items.${index}.levCode`)} />
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <Input {...register(`items.${index}.description`)} />
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Reference
                  </label>
                  <Input {...register(`items.${index}.reference`)} />
                </div>

                {NUMERIC_FIELDS.map((numeric) => (
                  <div key={numeric.name}>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {numeric.label}
                    </label>
                    <Input
                      type="number"
                      step={numeric.step}
                      {...register(`items.${index}.${numeric.name}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-1 size-3.5" /> New line
      </Button>

      <ProductPickerDialog
        isOpen={pickerIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerIndex(null);
          }
        }}
        onCancel={() => setPickerIndex(null)}
        onSelect={handleSelectProduct}
        products={products}
        productGroups={productGroups}
      />
    </section>
  );
};
