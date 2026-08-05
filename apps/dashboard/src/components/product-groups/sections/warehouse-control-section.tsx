"use client";

import { useFormContext } from "react-hook-form";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { enumOptions } from "@/lib/helpers";
import {
  customerLabelOptions,
  stockLabelPrintingOptions,
  stockLabelTypes,
} from "@/lib/enums";
import { CUSTOMER_LABEL_OPTION_LABELS, STOCK_LABEL_PRINTING_LABELS, STOCK_LABEL_TYPE_LABELS } from "@/lib/labels";

const stockLabelTypeOptions = enumOptions(
  stockLabelTypes,
  STOCK_LABEL_TYPE_LABELS,
);
const stockLabelPrintingOpts = enumOptions(
  stockLabelPrintingOptions,
  STOCK_LABEL_PRINTING_LABELS,
);
const customerLabelOpts = enumOptions(
  customerLabelOptions,
  CUSTOMER_LABEL_OPTION_LABELS,
);

export const WarehouseControlSection = () => {
  const {
    register,
    control,
    watch,
    setValue,
  } = useFormContext<ProductGroupFormValues>();

  return (
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
  );
};
