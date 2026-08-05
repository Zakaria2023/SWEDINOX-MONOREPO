"use client";

import { updateMachineAvailability } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { AvailabilitySection } from "../sections/availability-section";
import { MachineSectionForm } from "./machine-section-form";

type Props = {
  machineUuid: string;
  defaultValues: MachineFormValues;
};

export const MachineAvailabilityEditor = ({
  machineUuid,
  defaultValues,
}: Props) => (
  <MachineSectionForm
    machineUuid={machineUuid}
    defaultValues={defaultValues}
    save={updateMachineAvailability}
  >
    <AvailabilitySection />
  </MachineSectionForm>
);
