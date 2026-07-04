"use client";

import { useProductGroupSubmit } from "@/app/(dashboard)/product-groups/use-product-group-submit";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { DocumentUploader } from "@/components/document-uploader";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  articleGroups,
  ceStandards,
  certificaatOptions,
  customerLabelOptions,
  decimalPlacesOptions,
  deliveryTimeUnits,
  featuresQualities,
  leadTimeMethods,
  processedOptions,
  productQualityStandards,
  productShapes,
  purchasingUnits,
  revenueGroups,
  salesUnitOptions,
  stockLabelPrintingOptions,
  stockLabelTypes,
  stockModes,
  vatCodes,
  LeadTimeMethod,
  StockMode,
} from "@/lib/enums";
import {
  ARTICLE_GROUP_LABELS,
  CE_STANDARD_LABELS,
  CERTIFICAAT_LABELS,
  COMMON_TEXT,
  CUSTOMER_LABEL_OPTION_LABELS,
  DELIVERY_TIME_UNIT_LABELS,
  FEATURES_QUALITY_LABELS,
  LEAD_TIME_METHOD_LABELS,
  PROCESSED_OPTION_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
  PRODUCT_SHAPE_LABELS,
  PURCHASING_UNIT_LABELS,
  REVENUE_GROUP_LABELS,
  SALES_UNIT_LABELS,
  STOCK_LABEL_PRINTING_LABELS,
  STOCK_LABEL_TYPE_LABELS,
  STOCK_MODE_LABELS,
  VAT_CODE_LABELS,
} from "@/lib/labels";

type Props = {
  existingGroups: ProductGroupOption[];
  companies: CompanyOption[];
};

const emptyOption = { value: "", label: COMMON_TEXT.emptyOption };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const productShapeOptions = makeEnumOptions(
  productShapes,
  PRODUCT_SHAPE_LABELS,
);
const articleGroupOptions = makeEnumOptions(
  articleGroups,
  ARTICLE_GROUP_LABELS,
);
const processedOptionOptions = makeEnumOptions(
  processedOptions,
  PROCESSED_OPTION_LABELS,
);
const ceOptions = makeEnumOptions(ceStandards, CE_STANDARD_LABELS);
const standardsQualityOptions = makeEnumOptions(
  productQualityStandards,
  PRODUCT_QUALITY_STANDARD_LABELS,
);
const featuresQualityOptions = makeEnumOptions(
  featuresQualities,
  FEATURES_QUALITY_LABELS,
);
const decimalPlacesOpts = decimalPlacesOptions.map((v) => ({
  value: v,
  label: v,
}));
const purchasingUnitOptions = makeEnumOptions(
  purchasingUnits,
  PURCHASING_UNIT_LABELS,
);
const deliveryTimeUnitOptions = makeEnumOptions(
  deliveryTimeUnits,
  DELIVERY_TIME_UNIT_LABELS,
);
const stockLabelTypeOptions = makeEnumOptions(
  stockLabelTypes,
  STOCK_LABEL_TYPE_LABELS,
);
const stockLabelPrintingOpts = makeEnumOptions(
  stockLabelPrintingOptions,
  STOCK_LABEL_PRINTING_LABELS,
);
const customerLabelOpts = makeEnumOptions(
  customerLabelOptions,
  CUSTOMER_LABEL_OPTION_LABELS,
);
const stockModeOpts = stockModes.map((v) => ({
  value: v,
  label: STOCK_MODE_LABELS[v as StockMode],
}));
const leadTimeMethodOpts = leadTimeMethods.map((v) => ({
  value: v,
  label: LEAD_TIME_METHOD_LABELS[v as LeadTimeMethod],
}));
const revenueGroupOptions = makeEnumOptions(
  revenueGroups,
  REVENUE_GROUP_LABELS,
);
const salesUnitOpts = makeEnumOptions(salesUnitOptions, SALES_UNIT_LABELS);
const vatCodeOptions = makeEnumOptions(vatCodes, VAT_CODE_LABELS);
const certificaatOpts = makeEnumOptions(certificaatOptions, CERTIFICAAT_LABELS);

export const ProductGroupForm = ({ existingGroups, companies }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    parentGroupOptions,
    supplierOptions,
    handleCancel,
  } = useProductGroupSubmit({ existingGroups, companies });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {state.error && <FormError>{state.error}</FormError>}

      {/* General */}
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

      {/* Basis */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Basis
        </h2>

        {/* Dimensions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FormLabel htmlFor="length">Length (mm)</FormLabel>
            <Input id="length" {...register("length")} />
          </div>
          <div>
            <FormLabel htmlFor="width">Width (mm)</FormLabel>
            <Input id="width" {...register("width")} />
          </div>
          <div>
            <FormLabel htmlFor="thickness">Thickness (mm)</FormLabel>
            <Input id="thickness" {...register("thickness")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="decimalPlaces"
            name="decimalPlaces"
            control={control}
            label="Decimal Places"
            options={decimalPlacesOpts}
            emptyValue=""
          />
          <label className="flex cursor-pointer items-center gap-3 pt-5">
            <Checkbox
              id="printDimensions"
              checked={watch("printDimensions")}
              onChange={(e) => setValue("printDimensions", e.target.checked)}
            />
            <span className="text-sm font-medium">Print Dimensions</span>
          </label>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="weight">Weight</FormLabel>
            <Input id="weight" {...register("weight")} />
          </div>
          <div>
            <FormLabel htmlFor="paintSurface">Paint Surface</FormLabel>
            <Input id="paintSurface" {...register("paintSurface")} />
          </div>
          <div>
            <FormLabel htmlFor="weightTheoretical">
              Weight Theoretical
            </FormLabel>
            <Input id="weightTheoretical" {...register("weightTheoretical")} />
          </div>
          <div>
            <FormLabel htmlFor="weightTrade">Weight Trade</FormLabel>
            <Input id="weightTrade" {...register("weightTrade")} />
          </div>
          <div>
            <FormLabel htmlFor="weightGerman">Weight German</FormLabel>
            <Input id="weightGerman" {...register("weightGerman")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="featuresQuality"
            name="featuresQuality"
            control={control}
            label="Features Quality"
            options={featuresQualityOptions}
            emptyValue=""
          />
          <FormSelectField
            id="standardsQuality"
            name="standardsQuality"
            control={control}
            label="Standards Quality"
            options={standardsQualityOptions}
            emptyValue=""
          />
          <FormSelectField
            id="tolerance"
            name="tolerance"
            control={control}
            label="Tolerance"
            options={standardsQualityOptions}
            emptyValue=""
          />
          <FormSelectField
            id="ce"
            name="ce"
            control={control}
            label="CE Standard"
            options={ceOptions}
            emptyValue=""
          />
          <FormSelectField
            id="processedOption"
            name="processedOption"
            control={control}
            label="Processed"
            options={processedOptionOptions}
            emptyValue=""
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="sourceProduct">Source Product</FormLabel>
            <Input id="sourceProduct" {...register("sourceProduct")} />
          </div>
          <div>
            <FormLabel htmlFor="industryNumber">Industry Number</FormLabel>
            <Input id="industryNumber" {...register("industryNumber")} />
          </div>
        </div>
      </section>

      {/* Purchase */}
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

      {/* Warehouse Control */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Warehouse Control
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="goodsReceiptTerm">Goods Receipt Term</FormLabel>
            <Input
              id="goodsReceiptTerm"
              type="number"
              min={0}
              {...register("goodsReceiptTerm", {
                setValueAs: (v) => (v === "" ? 0 : Number(v)),
              })}
            />
          </div>
          <FormSelectField
            id="stockLabelType"
            name="stockLabelType"
            control={control}
            label="Stock Label Type"
            options={stockLabelTypeOptions}
            emptyValue=""
          />
          <FormSelectField
            id="stockLabelPrinting"
            name="stockLabelPrinting"
            control={control}
            label="Stock Label Printing"
            options={stockLabelPrintingOpts}
            emptyValue=""
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="packagingMandatoryOnCompletion"
              checked={watch("packagingMandatoryOnCompletion")}
              onChange={(e) =>
                setValue("packagingMandatoryOnCompletion", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Packaging Mandatory on Completion
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="receiptInLocationsWithLimitedDimensions"
              checked={watch("receiptInLocationsWithLimitedDimensions")}
              onChange={(e) =>
                setValue(
                  "receiptInLocationsWithLimitedDimensions",
                  e.target.checked,
                )
              }
            />
            <span className="text-sm font-medium">
              Receipt in Locations with Limited Dimensions
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="includeInCsvForStockLabels"
              checked={watch("includeInCsvForStockLabels")}
              onChange={(e) =>
                setValue("includeInCsvForStockLabels", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Include in CSV for Stock Labels
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="suggestLastUsedChargeInScanner"
              checked={watch("suggestLastUsedChargeInScanner")}
              onChange={(e) =>
                setValue("suggestLastUsedChargeInScanner", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Suggest Last Used Charge in Scanner
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="alwaysApproveManuallyWarehouseWorkorderLine"
              checked={watch("alwaysApproveManuallyWarehouseWorkorderLine")}
              onChange={(e) =>
                setValue(
                  "alwaysApproveManuallyWarehouseWorkorderLine",
                  e.target.checked,
                )
              }
            />
            <span className="text-sm font-medium">
              Always Approve Manually (Warehouse WO Line)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="alwaysApproveManuallyProductionWorkorderLine"
              checked={watch("alwaysApproveManuallyProductionWorkorderLine")}
              onChange={(e) =>
                setValue(
                  "alwaysApproveManuallyProductionWorkorderLine",
                  e.target.checked,
                )
              }
            />
            <span className="text-sm font-medium">
              Always Approve Manually (Production WO Line)
            </span>
          </label>
        </div>

        {/* Tolerances */}
        <div>
          <p className="mb-3 text-sm font-medium">
            Tolerances when Reporting as Completed (%)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { id: "toleranceUnloadingQty", label: "Unloading Qty" },
                { id: "toleranceUnloadingKg", label: "Unloading Kg" },
                { id: "toleranceCountQty", label: "Count Qty" },
                { id: "toleranceCountKg", label: "Count Kg" },
                { id: "tolerancePickingQty", label: "Picking Qty" },
                { id: "tolerancePickingKg", label: "Picking Kg" },
                { id: "toleranceProductionQty", label: "Production Qty" },
              ] as const
            ).map(({ id, label }) => (
              <div key={id}>
                <FormLabel htmlFor={id}>{label}</FormLabel>
                <Input id={id} {...register(id)} />
              </div>
            ))}
          </div>
        </div>

        {/* Customer Labels */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormSelectField
            id="customerLabelForPickingSlip"
            name="customerLabelForPickingSlip"
            control={control}
            label="Customer Label (Picking Slip)"
            options={customerLabelOpts}
            emptyValue=""
          />
          <FormSelectField
            id="customerLabelForSawingSlip"
            name="customerLabelForSawingSlip"
            control={control}
            label="Customer Label (Sawing Slip)"
            options={customerLabelOpts}
            emptyValue=""
          />
          <FormSelectField
            id="customerLabelAtSurfTreatSlip"
            name="customerLabelAtSurfTreatSlip"
            control={control}
            label="Customer Label (Surf. Treat Slip)"
            options={customerLabelOpts}
            emptyValue=""
          />
        </div>
      </section>

      {/* Stock Policy */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Stock Policy
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Min Stock */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Minimum Stock</p>
            <FormSelectField
              id="minStockMode"
              name="minStockMode"
              control={control}
              label="Mode"
              options={stockModeOpts}
              emptyValue=""
            />
            <div>
              <FormLabel htmlFor="minStockMultiplier">Multiplier</FormLabel>
              <Input
                id="minStockMultiplier"
                {...register("minStockMultiplier")}
              />
            </div>
            <div>
              <FormLabel htmlFor="minStockFixedValue">Fixed Value</FormLabel>
              <Input
                id="minStockFixedValue"
                {...register("minStockFixedValue")}
              />
            </div>
            <div>
              <FormLabel htmlFor="minStockUnit">Unit</FormLabel>
              <Input id="minStockUnit" {...register("minStockUnit")} />
            </div>
          </div>

          {/* Max Stock */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Maximum Stock</p>
            <FormSelectField
              id="maxStockMode"
              name="maxStockMode"
              control={control}
              label="Mode"
              options={stockModeOpts}
              emptyValue=""
            />
            <div>
              <FormLabel htmlFor="maxStockMultiplier">Multiplier</FormLabel>
              <Input
                id="maxStockMultiplier"
                {...register("maxStockMultiplier")}
              />
            </div>
            <div>
              <FormLabel htmlFor="maxStockFixedValue">Fixed Value</FormLabel>
              <Input
                id="maxStockFixedValue"
                {...register("maxStockFixedValue")}
              />
            </div>
            <div>
              <FormLabel htmlFor="maxStockUnit">Unit</FormLabel>
              <Input id="maxStockUnit" {...register("maxStockUnit")} />
            </div>
          </div>
        </div>

        {/* StockOp Parameters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="leadTimeMethod"
            name="leadTimeMethod"
            control={control}
            label="Lead Time Method"
            options={leadTimeMethodOpts}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="leadTime">Lead Time (days)</FormLabel>
            <Input
              id="leadTime"
              type="number"
              min={0}
              {...register("leadTime", {
                setValueAs: (v) => (v === "" ? 0 : Number(v)),
              })}
            />
          </div>
          <div>
            <FormLabel htmlFor="reviewPeriod">Review Period (days)</FormLabel>
            <Input
              id="reviewPeriod"
              type="number"
              min={0}
              {...register("reviewPeriod", {
                setValueAs: (v) => (v === "" ? 0 : Number(v)),
              })}
            />
          </div>
          <div>
            <FormLabel htmlFor="orderCostsPurchasingSide">
              Order Costs Purchasing Side
            </FormLabel>
            <Input
              id="orderCostsPurchasingSide"
              {...register("orderCostsPurchasingSide")}
            />
          </div>
          <div>
            <FormLabel htmlFor="orderCostsLogistics">
              Order Costs Logistics
            </FormLabel>
            <Input
              id="orderCostsLogistics"
              {...register("orderCostsLogistics")}
            />
          </div>
          <div>
            <FormLabel htmlFor="stockOpOrderSeries">Order Series</FormLabel>
            <Input
              id="stockOpOrderSeries"
              {...register("stockOpOrderSeries")}
            />
          </div>
          <div>
            <FormLabel htmlFor="minOrderQty">Min Order Qty</FormLabel>
            <Input id="minOrderQty" {...register("minOrderQty")} />
          </div>
          <div>
            <FormLabel htmlFor="capitalCost">Capital Cost</FormLabel>
            <Input id="capitalCost" {...register("capitalCost")} />
          </div>
          <div>
            <FormLabel htmlFor="warehouseCost">Warehouse Cost</FormLabel>
            <Input id="warehouseCost" {...register("warehouseCost")} />
          </div>
          <div>
            <FormLabel htmlFor="b2StockoutPct1">B2 Stockout %1</FormLabel>
            <Input id="b2StockoutPct1" {...register("b2StockoutPct1")} />
          </div>
          <div>
            <FormLabel htmlFor="b2StockoutPct2">B2 Stockout %2</FormLabel>
            <Input id="b2StockoutPct2" {...register("b2StockoutPct2")} />
          </div>
          <div>
            <FormLabel htmlFor="handling">Handling</FormLabel>
            <Input id="handling" {...register("handling")} />
          </div>
          <div>
            <FormLabel htmlFor="transport">Transport</FormLabel>
            <Input id="transport" {...register("transport")} />
          </div>
          <div>
            <FormLabel htmlFor="pacClassification">
              PAC Classification
            </FormLabel>
            <Input id="pacClassification" {...register("pacClassification")} />
          </div>
          <div>
            <FormLabel htmlFor="orderAdviceCode">Order Advice Code</FormLabel>
            <Input id="orderAdviceCode" {...register("orderAdviceCode")} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="useStockOpForThisProduct"
              checked={watch("useStockOpForThisProduct")}
              onChange={(e) =>
                setValue("useStockOpForThisProduct", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Use StockOp for This Product
            </span>
          </label>
          <div>
            <p className="mb-2 text-sm font-medium">Order on Days</p>
            <div className="flex flex-wrap gap-4">
              {[
                { id: "orderOnMonday" as const, label: "Monday" },
                { id: "orderOnTuesday" as const, label: "Tuesday" },
                { id: "orderOnWednesday" as const, label: "Wednesday" },
                { id: "orderOnThursday" as const, label: "Thursday" },
                { id: "orderOnFriday" as const, label: "Friday" },
              ].map(({ id, label }) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    id={id}
                    checked={watch(id)}
                    onChange={(e) => setValue(id, e.target.checked)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sales */}
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
            <FormLabel htmlFor="maxSalesNetPrice">
              Max Sales Net Price
            </FormLabel>
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

      {/* Supplier */}
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

      {/* Documents */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </h2>
        <div className="space-y-2">
          {watch("documents")?.map((doc, index) => (
            <div key={doc.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{doc.fileName}</span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/documents/${doc.id}/delete`, {
                    method: "DELETE",
                  });
                  const current = watch("documents") ?? [];
                  setValue(
                    "documents",
                    current.filter((_, i) => i !== index),
                  );
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <DocumentUploader
          onSuccess={(uploads) => {
            const current = watch("documents") ?? [];
            setValue("documents", [
              ...current,
              ...uploads.map((u) => ({
                id: u.documentId,
                fileName: u.fileName,
              })),
            ]);
          }}
        />
      </section>

      <FormActions
        submitLabel="Save Product Group"
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
