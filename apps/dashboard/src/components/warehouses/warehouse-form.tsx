"use client";

import { useWarehouseSubmit } from "@/app/(dashboard)/warehouses/use-warehouse-submit";
import { WarehouseOption } from "@/app/(dashboard)/warehouses/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { DocumentUploader } from "@/components/document-uploader";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  warehouseLoadingLocations,
  warehouseProductTypes,
  warehouseTransportRegions,
  WarehouseLoadingLocation,
  WarehouseProductType,
  WarehouseTransportRegion,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_PRODUCT_TYPE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_CODES,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/helpers";
import { useFieldArray } from "react-hook-form";

import { WarehouseLocationOption } from "@/app/(dashboard)/warehouses/actions";

type Props = {
  existingWarehouses: WarehouseOption[];
  companies: CompanyOption[];
  warehouseLocations: WarehouseLocationOption[];
};

const transportRegionOptions = warehouseTransportRegions.map((r) => ({
  value: r,
  label: WAREHOUSE_TRANSPORT_REGION_CODES[r as WarehouseTransportRegion],
  description: WAREHOUSE_TRANSPORT_REGION_LABELS[r as WarehouseTransportRegion],
}));

const loadLocationOptions = [
  { value: "", label: COMMON_TEXT.emptyOption },
  ...warehouseLoadingLocations.map((l) => ({
    value: l,
    label: WAREHOUSE_LOADING_LOCATION_LABELS[l as WarehouseLoadingLocation],
  })),
];

export const WarehouseForm = ({
  existingWarehouses,
  companies,
  warehouseLocations,
}: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    addressOptions,
    adaptFromOptions,
    adaptFromValue,
    handleAdaptFrom,
    handleCancel,
    countMethodOptions,
    releaseMethodOptions,
    printMethodOptions,
    workorderSlipOptions,
    processingMethodOptions,
    companyOptions,
    warehouseLocationOptions,
    printerNameOptions,
    printerEntryOptions,
    stickerPerPickOptions,
  } = useWarehouseSubmit({ existingWarehouses, companies, warehouseLocations });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "loadLocations",
  });

  const loadLocations = watch("loadLocations");

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {state.error && <FormError>{state.error}</FormError>}

      {/* Adapt From */}
      {adaptFromOptions.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Adapt From
          </h2>
          <div className="max-w-sm">
            <Select
              id="adaptFrom"
              name="adaptFrom"
              options={adaptFromOptions}
              value={adaptFromValue}
              onValueChange={(value) => handleAdaptFrom(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Select an existing warehouse to inherit its settings. You can adjust
            any field before saving.
          </p>
        </section>
      )}

      {/* General */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          General
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
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
            id="locationType"
            name="locationType"
            control={control}
            label="Location Type"
            options={locationTypeOptions}
            emptyValue=""
          />

          <FormSelectField
            id="loadingLocation"
            name="loadingLocation"
            control={control}
            label="Loading Location"
            options={loadingLocationOptions}
            emptyValue=""
          />

          <FormSelectField
            id="address"
            name="address"
            control={control}
            label="Address"
            options={addressOptions}
            emptyValue=""
          />
        </div>
      </section>

      {/* Status */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </h2>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="blocked"
              checked={watch("blocked")}
              onChange={(e) => {
                setValue("blocked", e.target.checked);
                if (!e.target.checked) setValue("blockReason", "");
              }}
            />
            <span className="text-sm font-medium">Blocked</span>
          </label>

          <div
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2 transition-opacity",
              !blocked && "pointer-events-none opacity-40",
            )}
          >
            <FormSelectField
              id="blockReason"
              name="blockReason"
              control={control}
              label="Reason"
              options={blockReasonOptions}
              emptyValue=""
              disabled={!blocked}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="blockedForOptimization"
              checked={watch("blockedForOptimization")}
              onChange={(e) =>
                setValue("blockedForOptimization", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Blocked for Optimization
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="limitedDimensions"
              checked={watch("limitedDimensions")}
              onChange={(e) => setValue("limitedDimensions", e.target.checked)}
            />
            <span className="text-sm font-medium">Limited Dimensions</span>
          </label>
        </div>

        {/* Dimension Settings */}
        <section className="space-y-4 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Dimension Settings
          </h2>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <FormLabel htmlFor="minLength">Minimum Length</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="minLength"
                    type="number"
                    min={0}
                    {...register("minLength", {
                      setValueAs: (v) => (v === "" ? "" : Number(v)),
                    })}
                    aria-invalid={!!errors.minLength}
                  />
                  <span className="text-sm text-muted-foreground">mm</span>
                </div>
                <FormFieldError message={errors.minLength?.message} />
              </div>
              <div>
                <FormLabel htmlFor="maxLength">Maximum Length</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxLength"
                    type="number"
                    min={0}
                    {...register("maxLength", {
                      setValueAs: (v) => (v === "" ? "" : Number(v)),
                    })}
                    aria-invalid={!!errors.maxLength}
                  />
                  <span className="text-sm text-muted-foreground">mm</span>
                </div>
                <FormFieldError message={errors.maxLength?.message} />
              </div>
              <div>
                <FormLabel htmlFor="maxWidth">Maximum Width</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxWidth"
                    type="number"
                    min={0}
                    {...register("maxWidth", {
                      setValueAs: (v) => (v === "" ? "" : Number(v)),
                    })}
                    aria-invalid={!!errors.maxWidth}
                  />
                  <span className="text-sm text-muted-foreground">mm</span>
                </div>
                <FormFieldError message={errors.maxWidth?.message} />
              </div>
              <div>
                <FormLabel htmlFor="maxWeight">Maximum Weight</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxWeight"
                    type="number"
                    min={0}
                    {...register("maxWeight", {
                      setValueAs: (v) => (v === "" ? "" : Number(v)),
                    })}
                    aria-invalid={!!errors.maxWeight}
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
                <FormFieldError message={errors.maxWeight?.message} />
              </div>
            </div>
            <div>
              <FormLabel>Product Type</FormLabel>
              <div className="mt-2 space-y-3">
                {warehouseProductTypes.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <Checkbox
                      id={`productType-${type}`}
                      checked={watch("productTypes").includes(
                        type as WarehouseProductType,
                      )}
                      onChange={(e) => {
                        const current = watch("productTypes");
                        setValue(
                          "productTypes",
                          e.target.checked
                            ? [...current, type as WarehouseProductType]
                            : current.filter((t) => t !== type),
                        );
                      }}
                    />
                    <span className="text-sm font-medium">
                      {
                        WAREHOUSE_PRODUCT_TYPE_LABELS[
                          type as WarehouseProductType
                        ]
                      }
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* Load Locations */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Load Locations
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Transport Region
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Load Location
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No load locations added.
                  </td>
                </tr>
              )}
              {fields.map((field, index) => (
                <tr key={field.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <Select
                      id={`loadLocations.${index}.transportRegion`}
                      name={`loadLocations.${index}.transportRegion`}
                      options={transportRegionOptions}
                      columnHeaders={{ left: "Code", right: "Description" }}
                      value={loadLocations[index]?.transportRegion ?? ""}
                      onValueChange={(val) =>
                        setValue(
                          `loadLocations.${index}.transportRegion`,
                          val as WarehouseTransportRegion,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      id={`loadLocations.${index}.loadLocation`}
                      name={`loadLocations.${index}.loadLocation`}
                      options={loadLocationOptions}
                      value={loadLocations[index]?.loadLocation ?? ""}
                      onValueChange={(val) =>
                        setValue(
                          `loadLocations.${index}.loadLocation`,
                          val as WarehouseLoadingLocation,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() =>
            append({
              transportRegion: warehouseTransportRegions[0],
              loadLocation: "",
            })
          }
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          + Add Load Location
        </button>
      </section>

      {/* Count Workorders */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Count Workorders
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="countMethod"
            name="countMethod"
            control={control}
            label="Count Method"
            options={countMethodOptions}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="countMaxLinesPerCommand">
              Max. # Lines / Command
            </FormLabel>
            <Input
              id="countMaxLinesPerCommand"
              type="number"
              min={0}
              {...register("countMaxLinesPerCommand", {
                setValueAs: (v) => (v === "" ? "" : Number(v)),
              })}
            />
          </div>
          <FormSelectField
            id="countReleaseMethod"
            name="countReleaseMethod"
            control={control}
            label="Release Method"
            options={releaseMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="countPrintMethod"
            name="countPrintMethod"
            control={control}
            label="Print Method"
            options={printMethodOptions}
            emptyValue=""
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="countPrintStockOnSlip"
            checked={watch("countPrintStockOnSlip")}
            onChange={(e) => setValue("countPrintStockOnSlip", e.target.checked)}
          />
          <span className="text-sm font-medium">
            Print stock on count workorder slip
          </span>
        </label>
      </section>

      {/* Miscellaneous */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Miscellaneous
        </h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="makeWorkordersPerSubsection"
              checked={watch("makeWorkordersPerSubsection")}
              onChange={(e) =>
                setValue("makeWorkordersPerSubsection", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Make workorders per subsection
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="capacityPerResource"
              checked={watch("capacityPerResource")}
              onChange={(e) =>
                setValue("capacityPerResource", e.target.checked)
              }
            />
            <span className="text-sm font-medium">Capacity per resource</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="sortLinesByWidthProductCodeLength"
              checked={watch("sortLinesByWidthProductCodeLength")}
              onChange={(e) =>
                setValue("sortLinesByWidthProductCodeLength", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Sort lines on pick- and fetch workorders by width (descending),
              product code (ascending), length (descending)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="printAllLocationsOnSlip"
              checked={watch("printAllLocationsOnSlip")}
              onChange={(e) =>
                setValue("printAllLocationsOnSlip", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Print all locations where product stock is located on the
              unloading and picking workorder slip
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="addSectionToCsvFileName"
              checked={watch("addSectionToCsvFileName")}
              onChange={(e) =>
                setValue("addSectionToCsvFileName", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Add section to CSV file name
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="addSubsectionToCsvFileName"
              checked={watch("addSubsectionToCsvFileName")}
              onChange={(e) =>
                setValue("addSubsectionToCsvFileName", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Add subsection to CSV file name
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="addProductTypeToCsvFileName"
              checked={watch("addProductTypeToCsvFileName")}
              onChange={(e) =>
                setValue("addProductTypeToCsvFileName", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Add product type to CSV file name
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="orderEntryDeadlineForInternal">
              Order Entry Deadline for Internal
            </FormLabel>
            <Input
              id="orderEntryDeadlineForInternal"
              placeholder="00:00"
              maxLength={5}
              {...register("orderEntryDeadlineForInternal")}
            />
          </div>
          <FormSelectField
            id="workorderSlip"
            name="workorderSlip"
            control={control}
            label="Workorder Slip"
            options={workorderSlipOptions}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="callOffLocation">Call-off Location</FormLabel>
            <Input
              id="callOffLocation"
              {...register("callOffLocation")}
            />
          </div>
          <FormSelectField
            id="transportByCompanyUuid"
            name="transportByCompanyUuid"
            control={control}
            label="Transport By"
            options={companyOptions}
            emptyValue=""
          />
        </div>
      </section>

      {/* Picking Workorders */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Picking Workorders
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="pickingProcessingMethod"
            name="pickingProcessingMethod"
            control={control}
            label="Processing Method"
            options={processingMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="pickingReleaseMethod"
            name="pickingReleaseMethod"
            control={control}
            label="Release Method"
            options={releaseMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="pickingPrintingMethod"
            name="pickingPrintingMethod"
            control={control}
            label="Printing Method"
            options={printMethodOptions}
            emptyValue=""
          />
        </div>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="packagingMandatoryOnCompletion"
              checked={watch("packagingMandatoryOnCompletion")}
              onChange={(e) =>
                setValue("packagingMandatoryOnCompletion", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Packaging mandatory when reporting completion of picking or last
              production
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="packagingDialogueOnCompletion"
              checked={watch("packagingDialogueOnCompletion")}
              onChange={(e) =>
                setValue("packagingDialogueOnCompletion", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              Packaging dialogue when reporting completion of picking or last
              production workorder
            </span>
          </label>
        </div>
      </section>

      {/* Fetch Workorders for Surface Treatment */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fetch Workorders for Surface Treatment
        </h2>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="surfaceTreatmentMakePerSubsection"
            checked={watch("surfaceTreatmentMakePerSubsection")}
            onChange={(e) =>
              setValue("surfaceTreatmentMakePerSubsection", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Make workorders per subsection
          </span>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="surfaceTreatmentProcessingMethod"
            name="surfaceTreatmentProcessingMethod"
            control={control}
            label="Processing Method"
            options={processingMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="surfaceTreatmentReleaseMethod"
            name="surfaceTreatmentReleaseMethod"
            control={control}
            label="Release Method"
            options={releaseMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="surfaceTreatmentPrintingMethod"
            name="surfaceTreatmentPrintingMethod"
            control={control}
            label="Printing Method"
            options={printMethodOptions}
            emptyValue=""
          />
        </div>
      </section>

      {/* Fetch Workorders for Sawing */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fetch Workorders for Sawing
        </h2>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="sawingMakePerSubsection"
            checked={watch("sawingMakePerSubsection")}
            onChange={(e) =>
              setValue("sawingMakePerSubsection", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Make workorders per subsection
          </span>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="sawingProcessingMethod"
            name="sawingProcessingMethod"
            control={control}
            label="Processing Method"
            options={processingMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="sawingReleaseMethod"
            name="sawingReleaseMethod"
            control={control}
            label="Release Method"
            options={releaseMethodOptions}
            emptyValue=""
          />
          <FormSelectField
            id="sawingPrintingMethod"
            name="sawingPrintingMethod"
            control={control}
            label="Printing Method"
            options={printMethodOptions}
            emptyValue=""
          />
        </div>
      </section>

      {/* Print Settings */}
      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Print Settings
        </h2>

        {/* A4 Printers */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            A4 Printers
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormSelectField
              id="a4PrinterOriginal"
              name="a4PrinterOriginal"
              control={control}
              label="Original"
              options={printerNameOptions}
              emptyValue=""
            />
            <FormSelectField
              id="a4PrinterCopy1"
              name="a4PrinterCopy1"
              control={control}
              label="Copy 1"
              options={printerNameOptions}
              emptyValue=""
            />
            <FormSelectField
              id="a4PrinterCopy2"
              name="a4PrinterCopy2"
              control={control}
              label="Copy 2"
              options={printerNameOptions}
              emptyValue=""
            />
          </div>
        </div>

        {/* A4 Printers small material */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            A4 Printers Small Material
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Use these printers if the material is smaller than
            </span>
            <Input
              id="a4SmallMaterialThresholdMm"
              type="number"
              min={0}
              className="w-24"
              {...register("a4SmallMaterialThresholdMm", {
                setValueAs: (v) => (v === "" ? "" : Number(v)),
              })}
            />
            <span className="text-sm text-muted-foreground">mm</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormSelectField
              id="a4SmallPrinterOriginal"
              name="a4SmallPrinterOriginal"
              control={control}
              label="Original"
              options={printerNameOptions}
              emptyValue=""
            />
            <FormSelectField
              id="a4SmallPrinterCopy1"
              name="a4SmallPrinterCopy1"
              control={control}
              label="Copy 1"
              options={printerNameOptions}
              emptyValue=""
            />
            <FormSelectField
              id="a4SmallPrinterCopy2"
              name="a4SmallPrinterCopy2"
              control={control}
              label="Copy 2"
              options={printerNameOptions}
              emptyValue=""
            />
          </div>
        </div>

        {/* Sticker per pick + Other printers */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <FormSelectField
              id="stickerPerPickWorkorder"
              name="stickerPerPickWorkorder"
              control={control}
              label="Sticker per Pick / Last Production Workorder"
              options={stickerPerPickOptions}
              emptyValue=""
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Other Printers
            </h3>
            <FormSelectField
              id="labelPrinter"
              name="labelPrinter"
              control={control}
              label="Label Printer"
              options={printerNameOptions}
              emptyValue=""
            />
            <FormSelectField
              id="stickerPrinter"
              name="stickerPrinter"
              control={control}
              label="Sticker Printer"
              options={printerNameOptions}
              emptyValue=""
            />
          </div>
        </div>

        {/* CSV files for customer labels */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            CSV Files for Customer Labels
          </h3>
          <div className="flex items-center gap-2">
            <FormLabel htmlFor="csvCustomerLabelFileName">
              File name for CSV file for customer labels
            </FormLabel>
            <div className="flex items-center gap-1">
              <Input
                id="csvCustomerLabelFileName"
                className="w-36"
                {...register("csvCustomerLabelFileName")}
              />
              <span className="text-sm text-muted-foreground">.txt</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                id="csvCustomerLabelAddSection"
                checked={watch("csvCustomerLabelAddSection")}
                onChange={(e) =>
                  setValue("csvCustomerLabelAddSection", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                Add section to CSV file name
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                id="csvCustomerLabelAddSubsection"
                checked={watch("csvCustomerLabelAddSubsection")}
                onChange={(e) =>
                  setValue("csvCustomerLabelAddSubsection", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                Add subsection to CSV file name
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                id="csvCustomerLabelAddProductType"
                checked={watch("csvCustomerLabelAddProductType")}
                onChange={(e) =>
                  setValue("csvCustomerLabelAddProductType", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                Add product type to CSV file name
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Pick-up Workorders */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pick-up Workorders
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="pickupDefaultLocationUuid"
            name="pickupDefaultLocationUuid"
            control={control}
            label="Standard Pick-up Location"
            options={warehouseLocationOptions}
            emptyValue=""
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="pickupSlipPrinter"
            name="pickupSlipPrinter"
            control={control}
            label="Printer for Pick-up Slip"
            options={printerNameOptions}
            emptyValue=""
          />
          <FormSelectField
            id="pickupSlipPrinterEntry"
            name="pickupSlipPrinterEntry"
            control={control}
            label="Entry (Pick-up Slip)"
            options={printerEntryOptions}
            emptyValue=""
          />
          <FormSelectField
            id="pickupOrderPrinter"
            name="pickupOrderPrinter"
            control={control}
            label="Printer for Pick-up Order"
            options={printerNameOptions}
            emptyValue=""
          />
          <FormSelectField
            id="pickupOrderPrinterEntry"
            name="pickupOrderPrinterEntry"
            control={control}
            label="Entry (Pick-up Order)"
            options={printerEntryOptions}
            emptyValue=""
          />
        </div>
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </h2>
        <div className="space-y-2">
          {(watch("documents") ?? []).map((doc, index) => (
            <div key={doc.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{doc.fileName}</span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/documents/${doc.id}/delete`, { method: "DELETE" });
                  const current = watch("documents");
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
            const current = watch("documents");
            setValue("documents", [
              ...current,
              ...uploads.map((u) => ({ id: u.documentId, fileName: u.fileName })),
            ]);
          }}
        />
      </section>

      <FormActions
        submitLabel="Save Warehouse"
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
