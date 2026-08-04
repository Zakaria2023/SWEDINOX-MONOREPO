"use client";

import { updateWarehousePickupWorkorders } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseLocationOption } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { PickupWorkordersSection } from "../sections/pickup-workorders-section";
import { buildWarehouseOptions } from "../warehouse-options";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
  warehouseLocations: WarehouseLocationOption[];
};

export const WarehousePickupWorkordersEditor = ({
  warehouseUuid,
  defaultValues,
  warehouseLocations,
}: Props) => {
  const { warehouseLocationOptions, printerNameOptions, printerEntryOptions } =
    buildWarehouseOptions({ warehouseLocations });

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehousePickupWorkorders}
      submitLabel="Save Pick-up Workorders"
    >
      <PickupWorkordersSection
        warehouseLocationOptions={warehouseLocationOptions}
        printerNameOptions={printerNameOptions}
        printerEntryOptions={printerEntryOptions}
      />
    </WarehouseSectionForm>
  );
};
