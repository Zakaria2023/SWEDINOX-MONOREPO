"use client";

import { Controller } from "react-hook-form";
import { useProductSubmit } from "@/app/(dashboard)/products/use-product-submit";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { salesUnitOptions, SalesUnit } from "@/lib/enums";
import { SALES_UNIT_LABELS } from "@/lib/labels";

type Props = {
  productGroups: ProductGroupOption[];
};

const emptyOption = { value: "", label: "— None —" };

const unitOptions = [
  emptyOption,
  ...salesUnitOptions.map((u) => ({
    value: u,
    label: SALES_UNIT_LABELS[u as SalesUnit] ?? u,
  })),
];

export const ProductForm = ({ productGroups }: Props) => {
  const { form, isPending, onSubmit, state, groupOptions, handleCancel } =
    useProductSubmit({ productGroups });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormError>{state.error}</FormError>

      {/* Basic Information */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="productCode" required>
              Product Code
            </FormLabel>
            <Input id="productCode" {...register("productCode")} />
            <FormFieldError message={errors.productCode?.message} />
          </div>
          <div>
            <FormLabel htmlFor="commodityCode">Commodity Code</FormLabel>
            <Input id="commodityCode" {...register("commodityCode")} />
          </div>
          <div className="col-span-2">
            <FormLabel htmlFor="name" required>
              Product Name
            </FormLabel>
            <Input id="name" {...register("name")} />
            <FormFieldError message={errors.name?.message} />
          </div>
          <div className="col-span-2">
            <FormSelectField
              control={control}
              id="productGroupUuid"
              name="productGroupUuid"
              label="Product Group"
              options={groupOptions}
              emptyValue=""
            />
          </div>
        </div>
      </section>

      {/* Flags */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Flags</h2>
        <div className="flex flex-col gap-3">
          <Controller
            control={control}
            name="stockProduct"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                Stock Product
              </label>
            )}
          />
          <Controller
            control={control}
            name="standardProduct"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                Standard Product
              </label>
            )}
          />
        </div>
      </section>

      {/* Dimensions */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Dimensions</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FormLabel htmlFor="length">Length</FormLabel>
            <Input id="length" type="number" step="0.01" {...register("length")} />
          </div>
          <div>
            <FormLabel htmlFor="widthDiameter">Width / Diameter</FormLabel>
            <Input id="widthDiameter" type="number" step="0.01" {...register("widthDiameter")} />
          </div>
          <div>
            <FormLabel htmlFor="thickness">Thickness</FormLabel>
            <Input id="thickness" type="number" step="0.01" {...register("thickness")} />
          </div>
        </div>
      </section>

      {/* Stock & Weight */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Stock & Weight</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="technicalStock">Technical Stock</FormLabel>
            <Input id="technicalStock" type="number" step="0.001" {...register("technicalStock")} />
          </div>
          <FormSelectField
            control={control}
            id="stockUnit"
            name="stockUnit"
            label="Stock Unit (StkU)"
            options={unitOptions}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="theoreticalWeight">Theoretical Weight (kg)</FormLabel>
            <Input id="theoreticalWeight" type="number" step="0.0001" {...register("theoreticalWeight")} />
          </div>
          <FormSelectField
            control={control}
            id="weightUnit"
            name="weightUnit"
            label="Weight Unit"
            options={unitOptions}
            emptyValue=""
          />
        </div>
      </section>

      <FormActions
        submitLabel="Create Product"
        pendingLabel="Creating..."
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
