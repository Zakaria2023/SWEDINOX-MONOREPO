"use client";

import { updateWarehouseSawing } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { buildWarehouseOptions } from "../warehouse-options";
import { FetchWorkordersSawingSection } from "../sections/fetch-workorders-sawing-section";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseSawingEditor = ({
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
      save={updateWarehouseSawing}
      submitLabel="Save Sawing"
    >
      <FetchWorkordersSawingSection
        processingMethodOptions={processingMethodOptions}
        releaseMethodOptions={releaseMethodOptions}
        printMethodOptions={printMethodOptions}
      />
    </WarehouseSectionForm>
  );
};
