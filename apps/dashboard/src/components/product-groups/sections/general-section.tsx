"use client";

import { useFormContext } from "react-hook-form";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  articleGroups,
  productShapes,
} from "@/lib/enums";
import {
  ARTICLE_GROUP_LABELS,
  COMMON_TEXT,
  PRODUCT_SHAPE_LABELS,
} from "@/lib/labels";

type Props = {
  parentGroupOptions: { value: string; label: string }[];
};

const emptyOption = { value: "", label: COMMON_TEXT.emptyOption };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const productShapeOptions = makeEnumOptions(productShapes, PRODUCT_SHAPE_LABELS);
const articleGroupOptions = makeEnumOptions(articleGroups, ARTICLE_GROUP_LABELS);

export const GeneralSection = ({ parentGroupOptions }: Props) => {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProductGroupFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        General
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormLabel htmlFor="name" required>
            Name
          </FormLabel>
          <Input
            id="name"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          <FormFieldError message={errors.name?.message} />
        </div>

        <FormSelectField
          id="parentUuid"
          name="parentUuid"
          control={control}
          label="Parent Group"
          options={parentGroupOptions}
          emptyValue=""
        />

        <FormSelectField
          id="productShape"
          name="productShape"
          control={control}
          label="Product Shape"
          options={productShapeOptions}
          emptyValue=""
        />

        <FormSelectField
          id="articleGroup"
          name="articleGroup"
          control={control}
          label="Article Group"
          options={articleGroupOptions}
          emptyValue=""
        />

        <div>
          <FormLabel htmlFor="materialGroup">Material Group</FormLabel>
          <Input id="materialGroup" {...register("materialGroup")} />
        </div>

        <div>
          <FormLabel htmlFor="commodity">Commodity</FormLabel>
          <Input id="commodity" {...register("commodity")} />
        </div>

        <div>
          <FormLabel htmlFor="groupShortDesc">Short Description</FormLabel>
          <Input id="groupShortDesc" {...register("groupShortDesc")} />
        </div>

        <div className="sm:col-span-2">
          <FormLabel htmlFor="groupLongDesc">Long Description</FormLabel>
          <Input id="groupLongDesc" {...register("groupLongDesc")} />
        </div>

        <div>
          <FormLabel htmlFor="productShapeDesc">
            Product Shape Description
          </FormLabel>
          <Input id="productShapeDesc" {...register("productShapeDesc")} />
        </div>

        <div>
          <FormLabel htmlFor="searchCode1">Search Code 1</FormLabel>
          <Input id="searchCode1" {...register("searchCode1")} />
        </div>

        <div>
          <FormLabel htmlFor="searchCode2">Search Code 2</FormLabel>
          <Input id="searchCode2" {...register("searchCode2")} />
        </div>

        <div>
          <FormLabel htmlFor="searchCode3">Search Code 3</FormLabel>
          <Input id="searchCode3" {...register("searchCode3")} />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-2">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="scrap"
            checked={watch("scrap")}
            onChange={(e) => setValue("scrap", e.target.checked)}
          />
          <span className="text-sm font-medium">Scrap</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="packaging"
            checked={watch("packaging")}
            onChange={(e) => setValue("packaging", e.target.checked)}
          />
          <span className="text-sm font-medium">Packaging</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="descSalesPurchaseOverridable"
            checked={watch("descSalesPurchaseOverridable")}
            onChange={(e) =>
              setValue("descSalesPurchaseOverridable", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Desc Sales/Purchase Overridable
          </span>
        </label>
      </div>
    </section>
  );
};
