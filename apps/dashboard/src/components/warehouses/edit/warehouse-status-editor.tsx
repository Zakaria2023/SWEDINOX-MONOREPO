"use client";

import { updateWarehouseStatus } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { StatusSection } from "../sections/status-section";
import { buildWarehouseOptions } from "../warehouse-options";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseStatusEditor = ({
  warehouseUuid,
  defaultValues,
}: Props) => {
  const { blockReasonOptions } = buildWarehouseOptions();

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehouseStatus}
      submitLabel="Save Status"
    >
      <StatusSection
        blocked={defaultValues.blocked}
        blockReasonOptions={blockReasonOptions}
      />
    </WarehouseSectionForm>
  );
};
