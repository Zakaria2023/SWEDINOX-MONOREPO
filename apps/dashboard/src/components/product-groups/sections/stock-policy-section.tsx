"use client";

import { useFormContext } from "react-hook-form";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  leadTimeMethods,
  stockModes,
  LeadTimeMethod,
  StockMode,
} from "@/lib/enums";
import {
  LEAD_TIME_METHOD_LABELS,
  STOCK_MODE_LABELS,
} from "@/lib/labels";

const stockModeOpts = stockModes.map((v) => ({
  value: v,
  label: STOCK_MODE_LABELS[v as StockMode],
}));
const leadTimeMethodOpts = leadTimeMethods.map((v) => ({
  value: v,
  label: LEAD_TIME_METHOD_LABELS[v as LeadTimeMethod],
}));

export const StockPolicySection = () => {
  const {
    register,
    control,
    watch,
    setValue,
  } = useFormContext<ProductGroupFormValues>();

  return (
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
  );
};
