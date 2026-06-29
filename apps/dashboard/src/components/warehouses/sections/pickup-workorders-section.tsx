"use client";

import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

type Props = {
  warehouseLocationOptions: { value: string; label: string }[];
  printerNameOptions: { value: string; label: string }[];
  printerEntryOptions: { value: string; label: string }[];
};

export const PickupWorkordersSection = ({
  warehouseLocationOptions,
  printerNameOptions,
  printerEntryOptions,
}: Props) => {
  const { control } = useFormContext<WarehouseFormValues>();

  return (
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
  );
};
