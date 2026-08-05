"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { updateWarehouseMiscellaneous } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { MiscellaneousSection } from "../sections/miscellaneous-section";
import { buildWarehouseOptions } from "../warehouse-options";
import { WarehouseSectionForm } from "./warehouse-section-form";

type Props = {
  warehouseUuid: string;
  defaultValues: WarehouseFormValues;
  companies: CompanyOption[];
};

export const WarehouseMiscellaneousEditor = ({
  warehouseUuid,
  defaultValues,
  companies,
}: Props) => {
  const { workorderSlipOptions, companyOptions } = buildWarehouseOptions({
    companies,
  });

  return (
    <WarehouseSectionForm
      warehouseUuid={warehouseUuid}
      defaultValues={defaultValues}
      save={updateWarehouseMiscellaneous}
      submitLabel="Save Miscellaneous"
    >
      <MiscellaneousSection
        workorderSlipOptions={workorderSlipOptions}
        companyOptions={companyOptions}
      />
    </WarehouseSectionForm>
  );
};
