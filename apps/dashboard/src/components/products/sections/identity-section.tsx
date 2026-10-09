"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { SelectOption } from "@/components/shadcn/select";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { articleGroups } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { ARTICLE_GROUP_LABELS } from "@/lib/labels";
import { Controller } from "react-hook-form";

type Props = {
  groupOptions: SelectOption[];
  companyOptions: SelectOption[];
  revenueGroupOptions: SelectOption[];
};

const articleGroupOptions = enumOptions(articleGroups, ARTICLE_GROUP_LABELS);

export const IdentitySection = ({
  groupOptions,
  companyOptions,
  revenueGroupOptions,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Product</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <FormLabel htmlFor="productCode" required>
            Product
          </FormLabel>
          <Input id="productCode" {...register("productCode")} />
          <FormFieldError message={errors.productCode?.message} />
        </div>

        <div>
          <FormLabel htmlFor="name" required>
            Name
          </FormLabel>
          <Input id="name" {...register("name")} />
          <FormFieldError message={errors.name?.message} />
        </div>

        <FormSelectField
          control={control}
          id="productGroupUuid"
          name="productGroupUuid"
          label="Product group"
          options={groupOptions}
          emptyValue=""
        />

        <div>
          <FormLabel htmlFor="priceGroup">Price structure</FormLabel>
          <Input id="priceGroup" {...register("priceGroup")} />
        </div>

        <div>
          <FormLabel htmlFor="ean">EAN</FormLabel>
          <Input id="ean" {...register("ean")} />
        </div>

        <div>
          <FormLabel htmlFor="materialGroup">Material group</FormLabel>
          <Input id="materialGroup" {...register("materialGroup")} />
        </div>

        <div>
          <FormLabel htmlFor="commodityCode">Commodity</FormLabel>
          <Input id="commodityCode" {...register("commodityCode")} />
        </div>

        <div>
          <FormLabel htmlFor="oldProductCode">Old product code</FormLabel>
          <Input id="oldProductCode" {...register("oldProductCode")} />
        </div>

        <FormSelectField
          control={control}
          id="articleGroup"
          name="articleGroup"
          label="Article group"
          options={articleGroupOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="revenueGroupUuid"
          name="revenueGroupUuid"
          label="Revenue group"
          options={revenueGroupOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="companyUuid"
          name="companyUuid"
          label="Company"
          options={companyOptions}
          emptyValue=""
        />
      </div>

      {/* Search codes — three independent lookup keys, not a hierarchy. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FormLabel htmlFor="searchCode1">Search code 1</FormLabel>
          <Input id="searchCode1" {...register("searchCode1")} />
        </div>
        <div>
          <FormLabel htmlFor="searchCode2">Search code 2</FormLabel>
          <Input id="searchCode2" {...register("searchCode2")} />
        </div>
        <div>
          <FormLabel htmlFor="searchCode3">Search code 3</FormLabel>
          <Input id="searchCode3" {...register("searchCode3")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Controller
          control={control}
          name="scrap"
          render={({ field }) => (
            <FormCheckboxCard
              label="Scrap"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="packaging"
          render={({ field }) => (
            <FormCheckboxCard
              label="Packaging"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="descSalesPurchaseOverridable"
          render={({ field }) => (
            <FormCheckboxCard
              label="Description sales/purchase can be overwritten"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      {/* Descriptions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Descriptions
        </h3>
        <div>
          <FormLabel htmlFor="groupLongDesc">Group long</FormLabel>
          <Textarea id="groupLongDesc" rows={2} {...register("groupLongDesc")} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="groupShortDesc">Group short</FormLabel>
            <Input id="groupShortDesc" {...register("groupShortDesc")} />
          </div>
          <div>
            <FormLabel htmlFor="productShortDesc">Product short</FormLabel>
            <Input id="productShortDesc" {...register("productShortDesc")} />
          </div>
        </div>
      </div>
    </section>
  );
};
