"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { SelectOption } from "@/components/shadcn/select";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  countStockBases,
  dispatchStrategies,
  salesUnitOptions,
} from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import {
  COUNT_STOCK_BASIS_LABELS,
  DISPATCH_STRATEGY_LABELS,
  SALES_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  productOptions: SelectOption[];
  locationOptions: SelectOption[];
};

const stockUnitOpts = enumOptions(salesUnitOptions, SALES_UNIT_LABELS);
const dispatchStrategyOpts = enumOptions(
  dispatchStrategies,
  DISPATCH_STRATEGY_LABELS,
);
const countBasisOpts = enumOptions(countStockBases, COUNT_STOCK_BASIS_LABELS);

export const StockControlSection = ({
  productOptions,
  locationOptions,
}: Props) => {
  const { register, control, watch } = useFormContext<ProductFormValues>();

  const batchRegistration = watch("batchRegistration");

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">Stock control</h2>

      {/* Warehouse */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Warehouse</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormSelectField
            control={control}
            id="stockUnit"
            name="stockUnit"
            label="Stock unit"
            options={stockUnitOpts}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="scrapProductUuid"
            name="scrapProductUuid"
            label="Scrap product"
            options={productOptions}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="transferProductUuid"
            name="transferProductUuid"
            label="Transfer product"
            options={productOptions}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="packagingProductUuid"
            name="packagingProductUuid"
            label="Packaging product"
            options={productOptions}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="cdLocationUuid"
            name="cdLocationUuid"
            label="Cross-docking location"
            options={locationOptions}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="stockProductSince">
              Stock product since
            </FormLabel>
            <Controller
              name="stockProductSince"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="stockProductSince"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Controller
            control={control}
            name="stockProduct"
            render={({ field }) => (
              <FormCheckboxCard
                label="Stock product"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="standardProduct"
            render={({ field }) => (
              <FormCheckboxCard
                label="Standard product"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="groupProduct"
            render={({ field }) => (
              <FormCheckboxCard
                label="Group product"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>

      {/* Batch registration — the sub-settings only mean anything once batch
          registration itself is on, so they stay hidden until it is. */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Batch registration
        </h3>
        <Controller
          control={control}
          name="batchRegistration"
          render={({ field }) => (
            <FormCheckboxCard
              label="Batch registration"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />

        {batchRegistration && (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Controller
                control={control}
                name="batchRegisterLength"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Length"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <div>
                <FormLabel htmlFor="batchLengthMinimum">
                  Length minimum (mm)
                </FormLabel>
                <Input
                  id="batchLengthMinimum"
                  inputMode="decimal"
                  {...register("batchLengthMinimum")}
                />
              </div>
              <div>
                <FormLabel htmlFor="batchLengthInterval">
                  Length interval (mm)
                </FormLabel>
                <Input
                  id="batchLengthInterval"
                  inputMode="decimal"
                  {...register("batchLengthInterval")}
                />
              </div>
              <div>
                <FormLabel htmlFor="batchLengthRemainderTolerance">
                  Neglect remainder under (mm)
                </FormLabel>
                <Input
                  id="batchLengthRemainderTolerance"
                  inputMode="decimal"
                  {...register("batchLengthRemainderTolerance")}
                />
              </div>

              <Controller
                control={control}
                name="batchRegisterWidth"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Width"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <div>
                <FormLabel htmlFor="batchWidthMinimum">
                  Width minimum (mm)
                </FormLabel>
                <Input
                  id="batchWidthMinimum"
                  inputMode="decimal"
                  {...register("batchWidthMinimum")}
                />
              </div>
              <div>
                <FormLabel htmlFor="batchWidthInterval">
                  Width interval (mm)
                </FormLabel>
                <Input
                  id="batchWidthInterval"
                  inputMode="decimal"
                  {...register("batchWidthInterval")}
                />
              </div>
              <FormSelectField
                control={control}
                id="batchDispatchStrategy"
                name="batchDispatchStrategy"
                label="Dispatch strategy"
                options={dispatchStrategyOpts}
                emptyValue=""
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Controller
                control={control}
                name="batchUseOptimization"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Use optimization"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Controller
                control={control}
                name="batchCharge"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Charge"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Controller
                control={control}
                name="batchDoNotSplitPerBatch"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Do not split stock per batch"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Controller
                control={control}
                name="batchPlateNumber"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Plate number"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Controller
                control={control}
                name="batchPerPiece"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Per piece"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Controller
                control={control}
                name="batchNumber"
                render={({ field }) => (
                  <FormCheckboxCard
                    label="Batch number"
                    checked={field.value}
                    active={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Count settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Count settings
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FormLabel htmlFor="countFrequency">Count frequency</FormLabel>
            <Input
              id="countFrequency"
              type="number"
              {...register("countFrequency")}
            />
          </div>
          <div>
            <FormLabel htmlFor="lastCountDate">Last count</FormLabel>
            <Controller
              name="lastCountDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="lastCountDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <FormLabel htmlFor="nextCountTargetDate">
              Target date next
            </FormLabel>
            <Controller
              name="nextCountTargetDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="nextCountTargetDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <FormSelectField
            control={control}
            id="countStockBasis"
            name="countStockBasis"
            label="Count as the"
            options={countBasisOpts}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="countBelowQuantity">Below</FormLabel>
            <Input
              id="countBelowQuantity"
              inputMode="decimal"
              {...register("countBelowQuantity")}
            />
          </div>
          <FormSelectField
            control={control}
            id="countBelowUnit"
            name="countBelowUnit"
            label="Below — unit"
            options={stockUnitOpts}
            emptyValue=""
          />
        </div>
      </div>
    </section>
  );
};
