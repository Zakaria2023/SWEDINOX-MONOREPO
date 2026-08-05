"use client";

import { updateMachineCapacity } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { SelectOption } from "@/components/shadcn/select";
import { machineCapacityUnits } from "@/lib/enums";
import {
  MACHINE_CAPACITY_UNIT_CODES,
  MACHINE_CAPACITY_UNIT_LABELS,
} from "@/lib/labels";
import { CapacitySection } from "../sections/capacity-section";
import { MachineSectionForm } from "./machine-section-form";

type Props = {
  machineUuid: string;
  defaultValues: MachineFormValues;
};

export const MachineCapacityEditor = ({ machineUuid, defaultValues }: Props) => {
  const capacityUnitOptions: SelectOption[] = [
    { value: "", label: "Select an option" },
    ...machineCapacityUnits.map((unit) => ({
      value: unit,
      label: MACHINE_CAPACITY_UNIT_CODES[unit],
      description: MACHINE_CAPACITY_UNIT_LABELS[unit],
    })),
  ];

  return (
    <MachineSectionForm
      machineUuid={machineUuid}
      defaultValues={defaultValues}
      save={updateMachineCapacity}
    >
      <CapacitySection capacityUnitOptions={capacityUnitOptions} />
    </MachineSectionForm>
  );
};
