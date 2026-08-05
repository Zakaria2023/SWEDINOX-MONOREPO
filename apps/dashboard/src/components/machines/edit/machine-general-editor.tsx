"use client";

import { updateMachineGeneral } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { MachineStockLocationOption } from "@/app/(dashboard)/warehouses/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  machineLoadingTypes,
  machineOptionTypes,
  machineProductionTypes,
} from "@/lib/enums";
import {
  MACHINE_LOADING_LABELS,
  MACHINE_OPTION_LABELS,
  MACHINE_PRODUCTION_LABELS,
} from "@/lib/labels";
import { GeneralSection } from "../sections/general-section";
import { MachineSectionForm } from "./machine-section-form";

type Props = {
  machineUuid: string;
  defaultValues: MachineFormValues;
  stockLocations: MachineStockLocationOption[];
};

export const MachineGeneralEditor = ({
  machineUuid,
  defaultValues,
  stockLocations,
}: Props) => {
  const stockLocationOptions: SelectOption[] = [
    { value: "", label: "Select an option" },
    ...stockLocations.map((location) => ({
      value: location.uuid,
      label: location.name,
    })),
  ];

  const optionOptions: SelectOption[] = machineOptionTypes.map((option) => ({
    value: option,
    label: MACHINE_OPTION_LABELS[option],
  }));

  const productionOptions: SelectOption[] = machineProductionTypes.map(
    (production) => ({
      value: production,
      label: MACHINE_PRODUCTION_LABELS[production],
    }),
  );

  const loadingOptions: SelectOption[] = machineLoadingTypes.map((loading) => ({
    value: loading,
    label: MACHINE_LOADING_LABELS[loading],
  }));

  return (
    <MachineSectionForm
      machineUuid={machineUuid}
      defaultValues={defaultValues}
      save={updateMachineGeneral}
    >
      <GeneralSection
        optionOptions={optionOptions}
        productionOptions={productionOptions}
        loadingOptions={loadingOptions}
        stockLocationOptions={stockLocationOptions}
      />
    </MachineSectionForm>
  );
};
