"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { leadTimeMethods } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { LEAD_TIME_METHOD_LABELS } from "@/lib/labels";

const leadTimeMethodOpts = enumOptions(leadTimeMethods, LEAD_TIME_METHOD_LABELS);

const ORDER_DAYS = [
  { name: "orderOnMonday", label: "Monday" },
  { name: "orderOnTuesday", label: "Tuesday" },
  { name: "orderOnWednesday", label: "Wednesday" },
  { name: "orderOnThursday", label: "Thursday" },
  { name: "orderOnFriday", label: "Friday" },
] as const;

export const StockPolicySection = () => {
  const { register, control, watch } = useFormContext<ProductFormValues>();

  const minStockMode = watch("minStockMode");
  const maxStockMode = watch("maxStockMode");

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">Stock policy</h2>

      {/* Minimum / maximum stock: either a multiple of average monthly
          consumption, or a flat figure — never both. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Minimum stock
          </h3>
          <Controller
            control={control}
            name="minStockMode"
            render={({ field }) => (
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={field.value === "multiplier"}
                    onChange={() => field.onChange("multiplier")}
                  />
                  Times average monthly consumption
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={field.value === "fixed_value"}
                    onChange={() => field.onChange("fixed_value")}
                  />
                  Fixed value
                </label>
              </div>
            )}
          />
          {minStockMode === "fixed_value" ? (
            <div>
              <FormLabel htmlFor="minStockFixedValue">Fixed value</FormLabel>
              <Input
                id="minStockFixedValue"
                inputMode="decimal"
                {...register("minStockFixedValue")}
              />
            </div>
          ) : (
            <div>
              <FormLabel htmlFor="minStockMultiplier">Multiplier</FormLabel>
              <Input
                id="minStockMultiplier"
                inputMode="decimal"
                {...register("minStockMultiplier")}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Maximum stock
          </h3>
          <Controller
            control={control}
            name="maxStockMode"
            render={({ field }) => (
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={field.value === "multiplier"}
                    onChange={() => field.onChange("multiplier")}
                  />
                  Times average monthly consumption
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={field.value === "fixed_value"}
                    onChange={() => field.onChange("fixed_value")}
                  />
                  Fixed value
                </label>
              </div>
            )}
          />
          {maxStockMode === "fixed_value" ? (
            <div>
              <FormLabel htmlFor="maxStockFixedValue">Fixed value</FormLabel>
              <Input
                id="maxStockFixedValue"
                inputMode="decimal"
                {...register("maxStockFixedValue")}
              />
            </div>
          ) : (
            <div>
              <FormLabel htmlFor="maxStockMultiplier">Multiplier</FormLabel>
              <Input
                id="maxStockMultiplier"
                inputMode="decimal"
                {...register("maxStockMultiplier")}
              />
            </div>
          )}
        </div>
      </div>

      {/* StockOp parameters */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          StockOp parameters
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormSelectField
            control={control}
            id="leadTimeMethod"
            name="leadTimeMethod"
            label="Lead time method"
            options={leadTimeMethodOpts}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="leadTime">Lead time (L, days)</FormLabel>
            <Input id="leadTime" type="number" {...register("leadTime")} />
          </div>
          <div>
            <FormLabel htmlFor="reviewPeriod">Review period (R, days)</FormLabel>
            <Input
              id="reviewPeriod"
              type="number"
              {...register("reviewPeriod")}
            />
          </div>
          <div>
            <FormLabel htmlFor="orderCostsPurchasingSide">
              Order costs — purchasing (A1)
            </FormLabel>
            <Input
              id="orderCostsPurchasingSide"
              inputMode="decimal"
              {...register("orderCostsPurchasingSide")}
            />
          </div>
          <div>
            <FormLabel htmlFor="orderCostsLogistics">
              Order costs — logistics (A2)
            </FormLabel>
            <Input
              id="orderCostsLogistics"
              inputMode="decimal"
              {...register("orderCostsLogistics")}
            />
          </div>
          <div>
            <FormLabel htmlFor="stockOpOrderSeries">Order series (Kg)</FormLabel>
            <Input
              id="stockOpOrderSeries"
              inputMode="decimal"
              {...register("stockOpOrderSeries")}
            />
          </div>
          <div>
            <FormLabel htmlFor="minOrderQty">Minimum order qty (Kg)</FormLabel>
            <Input
              id="minOrderQty"
              inputMode="decimal"
              {...register("minOrderQty")}
            />
          </div>
        </div>
      </div>

      {/* Simulation parameters */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          StockOp simulation parameters
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FormLabel htmlFor="capitalCost">Capital cost (r1, €/€/year)</FormLabel>
            <Input
              id="capitalCost"
              inputMode="decimal"
              {...register("capitalCost")}
            />
          </div>
          <div>
            <FormLabel htmlFor="warehouseCost">
              Warehouse cost (r2, €/Kg/year)
            </FormLabel>
            <Input
              id="warehouseCost"
              inputMode="decimal"
              {...register("warehouseCost")}
            />
          </div>
          <div>
            <FormLabel htmlFor="b2StockoutPct1">B2 — stockout % (1)</FormLabel>
            <Input
              id="b2StockoutPct1"
              inputMode="decimal"
              {...register("b2StockoutPct1")}
            />
          </div>
          <div>
            <FormLabel htmlFor="b2StockoutPct2">B2 — stockout % (2)</FormLabel>
            <Input
              id="b2StockoutPct2"
              inputMode="decimal"
              {...register("b2StockoutPct2")}
            />
          </div>
          <div>
            <FormLabel htmlFor="handling">Handling (€/Kg)</FormLabel>
            <Input
              id="handling"
              inputMode="decimal"
              {...register("handling")}
            />
          </div>
          <div>
            <FormLabel htmlFor="transport">Transport (€/Kg)</FormLabel>
            <Input
              id="transport"
              inputMode="decimal"
              {...register("transport")}
            />
          </div>
        </div>
      </div>

      {/* StockOn ordering */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          StockOn ordering / evaluation
        </h3>
        <Controller
          control={control}
          name="useStockOpForThisProduct"
          render={({ field }) => (
            <FormCheckboxCard
              label="Use StockOp for this product"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ORDER_DAYS.map((day) => (
            <Controller
              key={day.name}
              control={control}
              name={day.name}
              render={({ field }) => (
                <FormCheckboxCard
                  label={day.label}
                  checked={field.value}
                  active={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="pacClassification">PAC classification</FormLabel>
            <Input
              id="pacClassification"
              {...register("pacClassification")}
            />
          </div>
          <div>
            <FormLabel htmlFor="orderAdviceCode">Order advice code</FormLabel>
            <Input id="orderAdviceCode" {...register("orderAdviceCode")} />
          </div>
        </div>
      </div>
    </section>
  );
};
