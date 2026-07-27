"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { SelectOption } from "@/components/shadcn/select";

type Props = {
  groupOptions: SelectOption[];
  companyOptions: SelectOption[];
};

export const BasicInformationSection = ({
  groupOptions,
  companyOptions,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
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
        <div className="col-span-2">
          <FormSelectField
            control={control}
            id="companyUuid"
            name="companyUuid"
            label="Supplier"
            options={companyOptions}
            emptyValue=""
          />
        </div>
      </div>
    </section>
  );
};
