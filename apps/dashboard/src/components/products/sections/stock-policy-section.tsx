"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { leadTimeMethods } from "@/lib/enums";
import { cn, enumOptions } from "@/lib/helpers";
import { LEAD_TIME_METHOD_LABELS } from "@/lib/labels";

const leadTimeMethodOpts = enumOptions(leadTimeMethods, LEAD_TIME_METHOD_LABELS);

const ORDER_DAYS = [
  { name: "orderOnMonday", label: "Monday" },
  { name: "orderOnTuesday", label: "Tuesday" },
  { name: "orderOnWednesday", label: "Wednesday" },
  { name: "orderOnThursday", label: "Thursday" },
  { name: "orderOnFriday", label: "Friday" },
] as const;

const NOT_BUILT =
  "Not built yet: there is no StockOp calculation in this application.";

// The reference's `Voorraadbeleid` panel: two columns, minimum stock with the
// StockOp parameters under it on the left, maximum stock with the StockOp
// ordering switch, the order days and the codes on the right. The StockOp
// parameters stay greyed until `Use StockOp for this product` is ticked.
export const StockPolicySection = () => {
  const { register, control, watch } = useFormContext<ProductFormValues>();

  const useStockOp = watch("useStockOpForThisProduct");
  const stockOpInputClass = cn(
    !useStockOp && "bg-muted text-muted-foreground",
  );

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">Stock policy</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Minimum stock: a multiple of the average monthly use, floored by
              the fixed value — or the fixed value alone. Both inputs show;
              the radio picks which one rules. */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Minimum stock
            </h3>
            <Controller
              control={control}
              name="minStockMode"
              render={({ field }) => (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      aria-label="Multiple of the average monthly use"
                      checked={field.value === "multiplier"}
                      onChange={() => field.onChange("multiplier")}
                    />
                    <Input
                      id="minStockMultiplier"
                      inputMode="decimal"
                      className="w-24"
                      {...register("minStockMultiplier")}
                    />
                    <span>
                      × the average monthly use, but at least the value entered
                      under &ldquo;Fixed value&rdquo;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      aria-label="Fixed value"
                      checked={field.value === "fixed_value"}
                      onChange={() => field.onChange("fixed_value")}
                    />
                    <span>Fixed value</span>
                    <Input
                      id="minStockFixedValue"
                      inputMode="decimal"
                      className="w-24"
                      {...register("minStockFixedValue")}
                    />
                    <span>KG</span>
                  </div>
                </div>
              )}
            />
          </div>

          {/* StockOp parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              StockOp parameters
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelectField
                control={control}
                id="leadTimeMethod"
                name="leadTimeMethod"
                label="Lead time method"
                options={leadTimeMethodOpts}
                emptyValue=""
                disabled={!useStockOp}
              />
              <div>
                <FormLabel htmlFor="leadTime">Lead time (L, days)</FormLabel>
                <Input
                  id="leadTime"
                  type="number"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("leadTime")}
                />
              </div>
              <div>
                <FormLabel htmlFor="reviewPeriod">
                  Review period (R, days)
                </FormLabel>
                <Input
                  id="reviewPeriod"
                  type="number"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("reviewPeriod")}
                />
              </div>
              <div>
                <FormLabel htmlFor="orderCostsPurchasingSide">
                  Order costs — purchasing (A1, €/order)
                </FormLabel>
                <Input
                  id="orderCostsPurchasingSide"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("orderCostsPurchasingSide")}
                />
              </div>
              <div>
                <FormLabel htmlFor="orderCostsLogistics">
                  Order costs — logistics (A2, €/order)
                </FormLabel>
                <Input
                  id="orderCostsLogistics"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("orderCostsLogistics")}
                />
              </div>
              <div>
                <FormLabel htmlFor="stockOpOrderSeries">
                  Order series (Kg)
                </FormLabel>
                <Input
                  id="stockOpOrderSeries"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("stockOpOrderSeries")}
                />
              </div>
              <div>
                <FormLabel htmlFor="minOrderQty">
                  Minimum order qty (Kg)
                </FormLabel>
                <Input
                  id="minOrderQty"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("minOrderQty")}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled
              title={NOT_BUILT}
            >
              Take over from the preferred supplier
            </Button>
          </div>

          {/* Simulation parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Parameters for the StockOp simulation version
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="capitalCost">
                  Capital cost (r1, €/€/year)
                </FormLabel>
                <Input
                  id="capitalCost"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
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
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("warehouseCost")}
                />
              </div>
              <div>
                <FormLabel htmlFor="b2StockoutPct1">
                  B2 (% per unit stockout)
                </FormLabel>
                <Input
                  id="b2StockoutPct1"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("b2StockoutPct1")}
                />
              </div>
              <div>
                <FormLabel htmlFor="b2StockoutPct2">
                  B2 (% per unit stockout)
                </FormLabel>
                <Input
                  id="b2StockoutPct2"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("b2StockoutPct2")}
                />
              </div>
              <div>
                <FormLabel htmlFor="handling">Handling (€/Kg)</FormLabel>
                <Input
                  id="handling"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("handling")}
                />
              </div>
              <div>
                <FormLabel htmlFor="transport">Transport (€/Kg)</FormLabel>
                <Input
                  id="transport"
                  inputMode="decimal"
                  readOnly={!useStockOp}
                  className={stockOpInputClass}
                  {...register("transport")}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled
              title={NOT_BUILT}
            >
              Use the product type parameters from the configuration
            </Button>
          </div>
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Maximum stock: a multiple of the average monthly use, capped by
              the fixed value when one above zero is entered. */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Maximum stock
            </h3>
            <Controller
              control={control}
              name="maxStockMode"
              render={({ field }) => (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      aria-label="Multiple of the average monthly use"
                      checked={field.value === "multiplier"}
                      onChange={() => field.onChange("multiplier")}
                    />
                    <Input
                      id="maxStockMultiplier"
                      inputMode="decimal"
                      className="w-24"
                      {...register("maxStockMultiplier")}
                    />
                    <span>
                      × the average monthly use, but when a value above zero
                      is entered under &ldquo;Fixed value&rdquo;, at most that
                      value
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      aria-label="Fixed value"
                      checked={field.value === "fixed_value"}
                      onChange={() => field.onChange("fixed_value")}
                    />
                    <span>Fixed value</span>
                    <Input
                      id="maxStockFixedValue"
                      inputMode="decimal"
                      className="w-24"
                      {...register("maxStockFixedValue")}
                    />
                    <span>KG</span>
                  </div>
                </div>
              )}
            />
          </div>

          {/* StockOp ordering parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              StockOp ordering parameters
            </h3>
            <Controller
              control={control}
              name="useStockOpForThisProduct"
              render={({ field }) => (
                <FormCheckboxCard
                  label="Use StockOp for this product?"
                  checked={field.value}
                  active={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            {/* Nothing here computes them, so they never have been. */}
            <p className="text-sm text-muted-foreground">
              StockOp parameters have never been calculated.
            </p>
          </div>

          {/* StockOp ordering / evaluation days */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              StockOp ordering / evaluation
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Set by the classification run, never typed — greyed on the
                reference. */}
            <div>
              <FormLabel htmlFor="pacClassification">
                ABC classification code
              </FormLabel>
              <Input
                id="pacClassification"
                readOnly
                className="bg-muted text-muted-foreground"
                {...register("pacClassification")}
              />
            </div>
            <div>
              <FormLabel htmlFor="orderAdviceCode">Order advice code</FormLabel>
              <Input id="orderAdviceCode" {...register("orderAdviceCode")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
