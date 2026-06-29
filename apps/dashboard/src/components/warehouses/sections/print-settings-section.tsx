"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

type Props = {
  printerNameOptions: { value: string; label: string }[];
  stickerPerPickOptions: { value: string; label: string }[];
};

export const PrintSettingsSection = ({
  printerNameOptions,
  stickerPerPickOptions,
}: Props) => {
  const { register, control, watch, setValue } =
    useFormContext<WarehouseFormValues>();

  return (
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
  );
};
