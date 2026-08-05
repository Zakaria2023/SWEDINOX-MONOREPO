"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  customerLabelOptions,
  stockLabelBreakdowns,
  stockLabelTypes,
} from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import {
  CUSTOMER_LABEL_OPTION_LABELS,
  STOCK_LABEL_BREAKDOWN_LABELS,
  STOCK_LABEL_TYPE_LABELS,
} from "@/lib/labels";

const stockLabelTypeOpts = enumOptions(stockLabelTypes, STOCK_LABEL_TYPE_LABELS);
const breakdownOpts = enumOptions(
  stockLabelBreakdowns,
  STOCK_LABEL_BREAKDOWN_LABELS,
);
const customerLabelOpts = enumOptions(
  customerLabelOptions,
  CUSTOMER_LABEL_OPTION_LABELS,
);

export const WarehouseControlSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">
        Warehouse control
      </h2>

      {/* Receipt and dispatch */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Receipt and dispatch
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Controller
            control={control}
            name="packagingMandatoryOnCompletion"
            render={({ field }) => (
              <FormCheckboxCard
                label="Packaging mandatory when reporting completion of pick or last workorder"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="unloadingWorkorderInStockUnit"
            render={({ field }) => (
              <FormCheckboxCard
                label="Unloading workorder in stock unit"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="receiptInLocationsWithLimitedDimensions"
            render={({ field }) => (
              <FormCheckboxCard
                label="Receipt in locations with limited dimensions"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="includeInCsvForStockLabels"
            render={({ field }) => (
              <FormCheckboxCard
                label="Include in CSV file for stock labels when printing unloading workorder"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="suggestLastUsedChargeInScanner"
            render={({ field }) => (
              <FormCheckboxCard
                label="Suggest last used charge in scanner"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FormLabel htmlFor="goodsReceiptTerm">
              Goods receipt term (business days)
            </FormLabel>
            <Input
              id="goodsReceiptTerm"
              type="number"
              {...register("goodsReceiptTerm")}
            />
          </div>
          <FormSelectField
            control={control}
            id="stockLabelType"
            name="stockLabelType"
            label="Stock label type"
            options={stockLabelTypeOpts}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="stockLabelBreakdown"
            name="stockLabelBreakdown"
            label="Print labels"
            options={breakdownOpts}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="stockLabelPieces">Piece(s)</FormLabel>
            <Input
              id="stockLabelPieces"
              type="number"
              min={1}
              {...register("stockLabelPieces")}
            />
          </div>
        </div>
      </div>

      {/* Customer labels */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Customer labels
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormSelectField
            control={control}
            id="customerLabelForPickingSlip"
            name="customerLabelForPickingSlip"
            label="For picking workorder slip"
            options={customerLabelOpts}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="customerLabelForSawingSlip"
            name="customerLabelForSawingSlip"
            label="For sawing workorder slip"
            options={customerLabelOpts}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="customerLabelAtSurfTreatSlip"
            name="customerLabelAtSurfTreatSlip"
            label="At surface treatment workorder slip"
            options={customerLabelOpts}
            emptyValue=""
          />
        </div>
      </div>

      {/* Tolerances — how far a reported completion may differ from the order
          before it has to be approved by hand. */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tolerances when reporting as completed (%)
        </h3>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workorder type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Kg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Unloading workorder</TableCell>
                <TableCell>
                  <Input
                    aria-label="Unloading workorder quantity tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("toleranceUnloadingQty")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label="Unloading workorder weight tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("toleranceUnloadingKg")}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Count workorder</TableCell>
                <TableCell>
                  <Input
                    aria-label="Count workorder quantity tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("toleranceCountQty")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label="Count workorder weight tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("toleranceCountKg")}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Picking workorder</TableCell>
                <TableCell>
                  <Input
                    aria-label="Picking workorder quantity tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("tolerancePickingQty")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label="Picking workorder weight tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("tolerancePickingKg")}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Production workorder</TableCell>
                <TableCell>
                  <Input
                    aria-label="Production workorder quantity tolerance"
                    inputMode="decimal"
                    className="w-24"
                    {...register("toleranceProductionQty")}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Always approve manually */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Always approve manually
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="alwaysApproveManuallyWarehouseWorkorderLine"
            render={({ field }) => (
              <FormCheckboxCard
                label="Warehouse workorder line"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="alwaysApproveManuallyProductionWorkorderLine"
            render={({ field }) => (
              <FormCheckboxCard
                label="Production workorder line"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
};
