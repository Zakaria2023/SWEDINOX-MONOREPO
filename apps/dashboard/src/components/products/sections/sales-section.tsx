"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  certificaatOptions,
  purchasingUnits,
  salesUnitOptions,
  vatCodes,
} from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import {
  CERTIFICAAT_LABELS,
  PURCHASING_UNIT_LABELS,
  SALES_UNIT_LABELS,
  VAT_CODE_LABELS,
} from "@/lib/labels";

const salesUnitOpts = enumOptions(salesUnitOptions, SALES_UNIT_LABELS);
const purchasingUnitOpts = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);
const vatCodeOpts = enumOptions(vatCodes, VAT_CODE_LABELS);
const certificaatOpts = enumOptions(certificaatOptions, CERTIFICAAT_LABELS);

export const SalesSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">Sales</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormSelectField
          control={control}
          id="salesUnit"
          name="salesUnit"
          label="Sales unit"
          options={salesUnitOpts}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="salesUnitPrice"
          name="salesUnitPrice"
          label="Unit price"
          options={purchasingUnitOpts}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="vatCode"
          name="vatCode"
          label="VAT code"
          options={vatCodeOpts}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="certificaat"
          name="certificaat"
          label="Certificate"
          options={certificaatOpts}
          emptyValue=""
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Controller
          control={control}
          name="roundWeightPerPieceUp"
          render={({ field }) => (
            <FormCheckboxCard
              label="Round weight per piece up"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="benorProduct"
          render={({ field }) => (
            <FormCheckboxCard
              label="Benor product"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="productCodeOnQuoteOrderInvoice"
          render={({ field }) => (
            <FormCheckboxCard
              label="Product code on quote / order / invoice"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      {/* Website */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Controller
            control={control}
            name="websiteExport"
            render={({ field }) => (
              <FormCheckboxCard
                label="Export"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="websiteBlockedForSales"
            render={({ field }) => (
              <FormCheckboxCard
                label="Blocked for sales"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="descriptionProductShort"
            render={({ field }) => (
              <FormCheckboxCard
                label="Description product short"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="showWeightPerPiece"
            render={({ field }) => (
              <FormCheckboxCard
                label="Show weight per piece"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="showPackagingPerPiece"
            render={({ field }) => (
              <FormCheckboxCard
                label="Show packaging per piece"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="markProductGroup"
            render={({ field }) => (
              <FormCheckboxCard
                label="Mark product (group)"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="priceOnRequest"
            render={({ field }) => (
              <FormCheckboxCard
                label="Price on request"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>

      {/* Several */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Several</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Controller
            control={control}
            name="severalBlockedForSales"
            render={({ field }) => (
              <FormCheckboxCard
                label="Blocked for sales"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="vehicleWithCraneRequired"
            render={({ field }) => (
              <FormCheckboxCard
                label="Vehicle with crane required"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="vehicleWithCanopyRequired"
            render={({ field }) => (
              <FormCheckboxCard
                label="Vehicle with canopy required"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="alwaysReserveStock"
            render={({ field }) => (
              <FormCheckboxCard
                label="Always reserve stock"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>

      {/* Minimum profit margins — the floors a quote line is checked against. */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Minimum profit margins (%)
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FormLabel htmlFor="minProfitMarginStock">Stock</FormLabel>
            <Input
              id="minProfitMarginStock"
              inputMode="decimal"
              {...register("minProfitMarginStock")}
            />
          </div>
          <div>
            <FormLabel htmlFor="minProfitMarginExWorks">Ex works</FormLabel>
            <Input
              id="minProfitMarginExWorks"
              inputMode="decimal"
              {...register("minProfitMarginExWorks")}
            />
          </div>
          <div>
            <FormLabel htmlFor="minProfitMarginCrossDocking">
              Cross docking
            </FormLabel>
            <Input
              id="minProfitMarginCrossDocking"
              inputMode="decimal"
              {...register("minProfitMarginCrossDocking")}
            />
          </div>
        </div>
      </div>

      {/* Order */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Order</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FormLabel htmlFor="maxSalesLineQty">Max. line qty</FormLabel>
            <Input
              id="maxSalesLineQty"
              inputMode="decimal"
              {...register("maxSalesLineQty")}
            />
          </div>
          <div>
            <FormLabel htmlFor="maxSalesNetPrice">Max. net price</FormLabel>
            <Input
              id="maxSalesNetPrice"
              inputMode="decimal"
              {...register("maxSalesNetPrice")}
            />
          </div>
          <div>
            <FormLabel htmlFor="handlingCosts">Handling costs</FormLabel>
            <Input
              id="handlingCosts"
              inputMode="decimal"
              {...register("handlingCosts")}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
