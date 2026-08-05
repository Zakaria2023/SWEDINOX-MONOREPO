"use client";

import { updateWarehousePickingWorkorders } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { buildWarehouseOptions } from "../warehouse-options";
import { PickingWorkordersSection } from "../sections/picking-workorders-section";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehousePickingWorkordersEditor = ({
  warehouseUuid,
  defaultValues,
}: Props) => {
  const {
    processingMethodOptions,
    releaseMethodOptions,
    printMethodOptions,
  } = buildWarehouseOptions();

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehousePickingWorkorders}
      submitLabel="Save Picking Workorders"
    >
      <PickingWorkordersSection
        processingMethodOptions={processingMethodOptions}
        releaseMethodOptions={releaseMethodOptions}
        printMethodOptions={printMethodOptions}
      />
    </WarehouseSectionForm>
  );
};
