"use client";

import { useFormContext } from "react-hook-form";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  deliveryTimeUnits,
  purchasingUnits,
} from "@/lib/enums";
import { DELIVERY_TIME_UNIT_LABELS, PURCHASING_UNIT_LABELS } from "@/lib/labels";

const emptyOption = { value: "", label: "Empty" };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const purchasingUnitOptions = makeEnumOptions(
  purchasingUnits,
  PURCHASING_UNIT_LABELS,
);
const deliveryTimeUnitOptions = makeEnumOptions(
  deliveryTimeUnits,
  DELIVERY_TIME_UNIT_LABELS,
);

export const PurchaseSection = () => {
  const {
    register,
    control,
    watch,
    setValue,
  } = useFormContext<ProductGroupFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Purchase
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="purchasingUnit"
          name="purchasingUnit"
          control={control}
          label="Purchasing Unit"
          options={purchasingUnitOptions}
          emptyValue=""
        />
        <FormSelectField
          id="unitPrice"
          name="unitPrice"
          control={control}
          label="Unit Price"
          options={purchasingUnitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="deliveryTime">Delivery Time</FormLabel>
          <Input
            id="deliveryTime"
            type="number"
            min={0}
            {...register("deliveryTime", {
              setValueAs: (v) => (v === "" ? 0 : Number(v)),
            })}
          />
        </div>
        <FormSelectField
          id="deliveryTimeUnit"
          name="deliveryTimeUnit"
          control={control}
          label="Delivery Time Unit"
          options={deliveryTimeUnitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="orderSeries">Order Series</FormLabel>
          <Input
            id="orderSeries"
            type="number"
            min={0}
            {...register("orderSeries", {
              setValueAs: (v) => (v === "" ? 0 : Number(v)),
            })}
          />
        </div>
        <div>
          <FormLabel htmlFor="maxLineQty">Max Line Qty</FormLabel>
          <Input id="maxLineQty" {...register("maxLineQty")} />
        </div>
        <div>
          <FormLabel htmlFor="maxNetPrice">Max Net Price</FormLabel>
          <Input id="maxNetPrice" {...register("maxNetPrice")} />
        </div>
        <div>
          <FormLabel htmlFor="orderingAdviceNotes">
            Ordering Advice Notes
          </FormLabel>
          <Input
            id="orderingAdviceNotes"
            {...register("orderingAdviceNotes")}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="blockedForPurchasing"
            checked={watch("blockedForPurchasing")}
            onChange={(e) =>
              setValue("blockedForPurchasing", e.target.checked)
            }
          />
          <span className="text-sm font-medium">Blocked for Purchasing</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="makingOrderAdvices"
            checked={watch("makingOrderAdvices")}
            onChange={(e) => setValue("makingOrderAdvices", e.target.checked)}
          />
          <span className="text-sm font-medium">Making Order Advices</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="productCodeOnPurchase"
            checked={watch("productCodeOnPurchase")}
            onChange={(e) =>
              setValue("productCodeOnPurchase", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Product Code on Purchase
          </span>
        </label>
      </div>
    </section>
  );
};
