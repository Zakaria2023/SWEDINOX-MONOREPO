"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { deliveryTimeUnits, purchasingUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { DELIVERY_TIME_UNIT_LABELS, PURCHASING_UNIT_LABELS } from "@/lib/labels";

const purchasingUnitOptions = enumOptions(
  purchasingUnits,
  PURCHASING_UNIT_LABELS,
);
const deliveryTimeUnitOptions = enumOptions(
  deliveryTimeUnits,
  DELIVERY_TIME_UNIT_LABELS,
);

export const PurchaseSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Purchase</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormSelectField
          control={control}
          id="purchasingUnit"
          name="purchasingUnit"
          label="Purchasing unit"
          options={purchasingUnitOptions}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="unitPrice"
          name="unitPrice"
          label="Unit price"
          options={purchasingUnitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="deliveryTime">Delivery time</FormLabel>
          <Input id="deliveryTime" type="number" {...register("deliveryTime")} />
        </div>
        <FormSelectField
          control={control}
          id="deliveryTimeUnit"
          name="deliveryTimeUnit"
          label="Delivery time unit"
          options={deliveryTimeUnitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="orderSeries">Order series</FormLabel>
          <Input id="orderSeries" type="number" {...register("orderSeries")} />
        </div>
        <div>
          <FormLabel htmlFor="maxLineQty">Max. line qty</FormLabel>
          <Input
            id="maxLineQty"
            inputMode="decimal"
            {...register("maxLineQty")}
          />
        </div>
        <div>
          <FormLabel htmlFor="maxNetPrice">Max. net price</FormLabel>
          <Input
            id="maxNetPrice"
            inputMode="decimal"
            {...register("maxNetPrice")}
          />
        </div>
      </div>

      <div>
        <FormLabel htmlFor="orderingAdviceNotes">Ordering advice notes</FormLabel>
        <Input id="orderingAdviceNotes" {...register("orderingAdviceNotes")} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Controller
          control={control}
          name="blockedForPurchasing"
          render={({ field }) => (
            <FormCheckboxCard
              label="Blocked for purchasing"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="makingOrderAdvices"
          render={({ field }) => (
            <FormCheckboxCard
              label="Making order advices"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="visibleInProductionSchedule"
          render={({ field }) => (
            <FormCheckboxCard
              label="Visible in production schedule"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="productCodeOnPurchase"
          render={({ field }) => (
            <FormCheckboxCard
              label="Product code on purchase request / quote / order"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>
    </section>
  );
};
