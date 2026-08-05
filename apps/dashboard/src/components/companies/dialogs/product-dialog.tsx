"use client";

import { ProductDialogValues } from "@/app/(dashboard)/companies/validation";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Select } from "@/components/shadcn/select";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { deliveryTimeUnits, purchasingUnits } from "@/lib/enums";
import {
  DELIVERY_TIME_UNIT_LABELS,
  PURCHASING_UNIT_LABELS,
} from "@/lib/labels";
import { Package } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<ProductDialogValues>;
  selectedProduct: ProductOption | null;
  onBrowse: () => void;
  submitLabel?: string;
};

const unitOptions = [
  { value: "", label: "Select" },
  ...purchasingUnits.map((u) => ({
    value: u,
    label: PURCHASING_UNIT_LABELS[u],
  })),
];

const deliveryTimeUnitOptions = [
  { value: "", label: "Select" },
  ...deliveryTimeUnits.map((u) => ({
    value: u,
    label: DELIVERY_TIME_UNIT_LABELS[u],
  })),
];

export const ProductDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  selectedProduct,
  onBrowse,
  submitLabel = "Add Product",
}: Props) => {
  const { register, control, formState } = form;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Add Product
          </DialogTitle>
          <DialogDescription>
            Pick a product and set its terms for this company.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel required>Product</FormLabel>
              <button
                type="button"
                onClick={onBrowse}
                className="mt-1.5 flex h-9 w-full items-center justify-between rounded-lg border border-input px-3 text-sm hover:border-primary"
              >
                <span className="line-clamp-1">
                  {selectedProduct
                    ? `${selectedProduct.productCode} — ${selectedProduct.name}`
                    : "Browse products…"}
                </span>
              </button>
              <FormFieldError message={formState.errors.productUuid?.message} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prod-preferred"
                {...register("preferred")}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="prod-preferred" className="text-sm">
                Preferred
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="prod-ean">EAN</FormLabel>
                <input
                  id="prod-ean"
                  {...register("ean")}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
              <div>
                <FormLabel htmlFor="prod-external-code">
                  External Product Code
                </FormLabel>
                <input
                  id="prod-external-code"
                  {...register("externalProductCode")}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="prod-editing">Editing</FormLabel>
              <input
                id="prod-editing"
                {...register("editing")}
                className="mt-1.5 h-9 w-full rounded-lg border border-input px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="prod-delivery-time">
                  Delivery Time
                </FormLabel>
                <input
                  id="prod-delivery-time"
                  type="number"
                  {...register("deliveryTime")}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
              <div>
                <FormLabel htmlFor="prod-delivery-time-unit">Unit</FormLabel>
                <Controller
                  name="deliveryTimeUnit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="prod-delivery-time-unit"
                      options={deliveryTimeUnitOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="prod-min-order-qty">
                  Min. Order Qty
                </FormLabel>
                <input
                  id="prod-min-order-qty"
                  {...register("minOrderQty")}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
              <div>
                <FormLabel htmlFor="prod-min-order-qty-unit">Unit</FormLabel>
                <Controller
                  name="minOrderQtyUnit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="prod-min-order-qty-unit"
                      options={unitOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="prod-order-series">Order Series</FormLabel>
                <input
                  id="prod-order-series"
                  type="number"
                  {...register("orderSeries")}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
              <div>
                <FormLabel htmlFor="prod-order-series-unit">Unit</FormLabel>
                <Controller
                  name="orderSeriesUnit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="prod-order-series-unit"
                      options={unitOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select"
                    />
                  )}
                />
              </div>
            </div>
          </DialogBody>

          <DialogFormFooter onCancel={onCancel} submitLabel={submitLabel} />
        </form>
      </DialogContent>
    </Dialog>
  );
};
