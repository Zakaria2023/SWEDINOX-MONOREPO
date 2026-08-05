"use client";

import { updateWarehouseDocumentsSection } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { DocumentsSection } from "../sections/documents-section";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseDocumentsEditor = ({ warehouseUuid, defaultValues }: Props) => (
  <WarehouseSectionForm
    warehouseUuid={warehouseUuid}
    defaultValues={defaultValues}
    save={updateWarehouseDocumentsSection}
    submitLabel="Save Documents"
  >
    <DocumentsSection />
  </WarehouseSectionForm>
);
