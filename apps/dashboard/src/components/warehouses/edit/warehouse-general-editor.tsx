"use client";

import { updateWarehouseGeneral } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { GeneralSection } from "../sections/general-section";
import { buildWarehouseOptions } from "../warehouse-options";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseGeneralEditor = ({
  warehouseUuid,
  defaultValues,
}: Props) => {
  const { locationTypeOptions, loadingLocationOptions, addressOptions } =
    buildWarehouseOptions();

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehouseGeneral}
      submitLabel="Save General"
    >
      <GeneralSection
        locationTypeOptions={locationTypeOptions}
        loadingLocationOptions={loadingLocationOptions}
        addressOptions={addressOptions}
      />
    </WarehouseSectionForm>
  );
};
