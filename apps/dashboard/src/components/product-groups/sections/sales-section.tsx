"use client";

import { useFormContext } from "react-hook-form";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  certificaatOptions,
  purchasingUnits,
  revenueGroups,
  salesUnitOptions,
  vatCodes,
} from "@/lib/enums";
import { CERTIFICAAT_LABELS, PURCHASING_UNIT_LABELS, REVENUE_GROUP_LABELS, SALES_UNIT_LABELS, VAT_CODE_LABELS } from "@/lib/labels";

const emptyOption = { value: "", label: "Empty" };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const revenueGroupOptions = makeEnumOptions(
  revenueGroups,
  REVENUE_GROUP_LABELS,
);
const salesUnitOpts = makeEnumOptions(salesUnitOptions, SALES_UNIT_LABELS);
const purchasingUnitOptions = makeEnumOptions(
  purchasingUnits,
  PURCHASING_UNIT_LABELS,
);
const vatCodeOptions = makeEnumOptions(vatCodes, VAT_CODE_LABELS);
const certificaatOpts = makeEnumOptions(certificaatOptions, CERTIFICAAT_LABELS);

export const SalesSection = () => {
  const { register, control, watch, setValue } =
    useFormContext<ProductGroupFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Sales
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="revenueGroup"
          name="revenueGroup"
          control={control}
          label="Revenue Group"
          options={revenueGroupOptions}
          emptyValue=""
        />
        <FormSelectField
          id="salesUnit"
          name="salesUnit"
          control={control}
          label="Sales Unit"
          options={salesUnitOpts}
          emptyValue=""
        />
        <FormSelectField
          id="salesUnitPrice"
          name="salesUnitPrice"
          control={control}
          label="Sales Unit Price"
          options={purchasingUnitOptions}
          emptyValue=""
        />
        <FormSelectField
          id="vatCode"
          name="vatCode"
          control={control}
          label="VAT Code"
          options={vatCodeOptions}
          emptyValue=""
        />
        <FormSelectField
          id="certificaat"
          name="certificaat"
          control={control}
          label="Certificate"
          options={certificaatOpts}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="minProfitMarginStock">
            Min Profit Margin Stock (%)
          </FormLabel>
          <Input
            id="minProfitMarginStock"
            {...register("minProfitMarginStock")}
          />
        </div>
        <div>
          <FormLabel htmlFor="minProfitMarginExWorks">
            Min Profit Margin Ex Works (%)
          </FormLabel>
          <Input
            id="minProfitMarginExWorks"
            {...register("minProfitMarginExWorks")}
          />
        </div>
        <div>
          <FormLabel htmlFor="minProfitMarginCrossDocking">
            Min Profit Margin Cross-Docking (%)
          </FormLabel>
          <Input
            id="minProfitMarginCrossDocking"
            {...register("minProfitMarginCrossDocking")}
          />
        </div>
        <div>
          <FormLabel htmlFor="maxSalesLineQty">Max Sales Line Qty</FormLabel>
          <Input id="maxSalesLineQty" {...register("maxSalesLineQty")} />
        </div>
        <div>
          <FormLabel htmlFor="maxSalesNetPrice">Max Sales Net Price</FormLabel>
          <Input id="maxSalesNetPrice" {...register("maxSalesNetPrice")} />
        </div>
        <div>
          <FormLabel htmlFor="handlingCosts">Handling Costs</FormLabel>
          <Input id="handlingCosts" {...register("handlingCosts")} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {[
          {
            id: "roundWeightPerPieceUp" as const,
            label: "Round Weight Per Piece Up",
          },
          { id: "benorProduct" as const, label: "Benor Product" },
          {
            id: "productCodeOnQuoteOrderInvoice" as const,
            label: "Product Code on Quote/Order/Invoice",
          },
          { id: "websiteExport" as const, label: "Website Export" },
          {
            id: "websiteBlockedForSales" as const,
            label: "Website Blocked for Sales",
          },
          {
            id: "descriptionProductShort" as const,
            label: "Short Description",
          },
          {
            id: "showWeightPerPiece" as const,
            label: "Show Weight Per Piece",
          },
          {
            id: "showPackagingPerPiece" as const,
            label: "Show Packaging Per Piece",
          },
          { id: "markProductGroup" as const, label: "Mark Product Group" },
          { id: "priceOnRequest" as const, label: "Price on Request" },
          {
            id: "severalBlockedForSales" as const,
            label: "Several Blocked for Sales",
          },
          {
            id: "vehicleWithCraneRequired" as const,
            label: "Vehicle with Crane Required",
          },
          {
            id: "vehicleWithCanopyRequired" as const,
            label: "Vehicle with Canopy Required",
          },
          {
            id: "alwaysReserveStock" as const,
            label: "Always Reserve Stock",
          },
        ].map(({ id, label }) => (
          <label key={id} className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id={id}
              checked={watch(id)}
              onChange={(e) => setValue(id, e.target.checked)}
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>
    </section>
  );
};
