"use client";

import { updateWarehouseCountWorkorders } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { buildWarehouseOptions } from "../warehouse-options";
import { CountWorkordersSection } from "../sections/count-workorders-section";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
};

export const WarehouseCountWorkordersEditor = ({
  warehouseUuid,
  defaultValues,
}: Props) => {
  const {
    countMethodOptions,
    releaseMethodOptions,
    printMethodOptions,
  } = buildWarehouseOptions();

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehouseCountWorkorders}
      submitLabel="Save Count Workorders"
    >
      <CountWorkordersSection
        countMethodOptions={countMethodOptions}
        releaseMethodOptions={releaseMethodOptions}
        printMethodOptions={printMethodOptions}
      />
    </WarehouseSectionForm>
  );
};
