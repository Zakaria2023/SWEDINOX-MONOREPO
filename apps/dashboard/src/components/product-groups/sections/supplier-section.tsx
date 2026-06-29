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
import {
  COMMON_TEXT,
  DELIVERY_TIME_UNIT_LABELS,
  PURCHASING_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  supplierOptions: { value: string; label: string }[];
};

const emptyOption = { value: "", label: COMMON_TEXT.emptyOption };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const deliveryTimeUnitOptions = makeEnumOptions(
  deliveryTimeUnits,
  DELIVERY_TIME_UNIT_LABELS,
);
const purchasingUnitOptions = makeEnumOptions(
  purchasingUnits,
  PURCHASING_UNIT_LABELS,
);

export const SupplierSection = ({ supplierOptions }: Props) => {
  const {
    register,
    control,
    watch,
    setValue,
  } = useFormContext<ProductGroupFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Supplier
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="supplierCompanyUuid"
          name="supplierCompanyUuid"
          control={control}
          label="Supplier"
          options={supplierOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="supplierEan">EAN</FormLabel>
          <Input id="supplierEan" {...register("supplierEan")} />
        </div>
        <div>
          <FormLabel htmlFor="supplierExternalProductCode">
            External Product Code
          </FormLabel>
          <Input
            id="supplierExternalProductCode"
            {...register("supplierExternalProductCode")}
          />
        </div>
        <div>
          <FormLabel htmlFor="supplierEditing">Editing</FormLabel>
          <Input id="supplierEditing" {...register("supplierEditing")} />
        </div>
        <div>
          <FormLabel htmlFor="supplierDeliveryTime">Delivery Time</FormLabel>
          <Input
            id="supplierDeliveryTime"
            type="number"
            min={0}
            {...register("supplierDeliveryTime", {
              setValueAs: (v) => (v === "" ? 0 : Number(v)),
            })}
          />
        </div>
        <FormSelectField
          id="supplierDeliveryTimeUnit"
          name="supplierDeliveryTimeUnit"
          control={control}
          label="Delivery Time Unit"
          options={deliveryTimeUnitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="supplierMoq">MOQ</FormLabel>
          <Input id="supplierMoq" {...register("supplierMoq")} />
        </div>
        <FormSelectField
          id="supplierMoqUnit"
          name="supplierMoqUnit"
          control={control}
          label="MOQ Unit"
          options={purchasingUnitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="supplierOrderSeries">Order Series</FormLabel>
          <Input
            id="supplierOrderSeries"
            type="number"
            min={0}
            {...register("supplierOrderSeries", {
              setValueAs: (v) => (v === "" ? 0 : Number(v)),
            })}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-3">
        <Checkbox
          id="supplierPreferred"
          checked={watch("supplierPreferred")}
          onChange={(e) => setValue("supplierPreferred", e.target.checked)}
        />
        <span className="text-sm font-medium">Preferred Supplier</span>
      </label>
    </section>
  );
};
