"use client";

import { updateWarehouseSurfaceTreatment } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { buildWarehouseOptions } from "../warehouse-options";
import { FetchWorkordersSurfaceTreatmentSection } from "../sections/fetch-workorders-surface-treatment-section";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseSurfaceTreatmentEditor = ({
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
      save={updateWarehouseSurfaceTreatment}
      submitLabel="Save Surface Treatment"
    >
      <FetchWorkordersSurfaceTreatmentSection
        processingMethodOptions={processingMethodOptions}
        releaseMethodOptions={releaseMethodOptions}
        printMethodOptions={printMethodOptions}
      />
    </WarehouseSectionForm>
  );
};
