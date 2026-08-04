"use client";

import { updateWarehouseLoadLocations } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { LoadLocationsSection } from "../sections/load-locations-section";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseLoadLocationsEditor = ({ warehouseUuid, defaultValues }: Props) => (
  <WarehouseSectionForm
    warehouseUuid={warehouseUuid}
    defaultValues={defaultValues}
    save={updateWarehouseLoadLocations}
    submitLabel="Save Load Locations"
  >
    <LoadLocationsSection />
  </WarehouseSectionForm>
);
