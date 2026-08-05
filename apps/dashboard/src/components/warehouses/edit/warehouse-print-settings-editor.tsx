"use client";

import { updateWarehousePrintSettings } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { PrintSettingsSection } from "../sections/print-settings-section";
import { buildWarehouseOptions } from "../warehouse-options";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehousePrintSettingsEditor = ({
  warehouseUuid,
  defaultValues,
}: Props) => {
  const { printerNameOptions, stickerPerPickOptions } = buildWarehouseOptions();

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehousePrintSettings}
      submitLabel="Save Print Settings"
    >
      <PrintSettingsSection
        printerNameOptions={printerNameOptions}
        stickerPerPickOptions={stickerPerPickOptions}
      />
    </WarehouseSectionForm>
  );
};
