"use client";

import { updateMachineDimensions } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { DimensionsAndRemarksSection } from "../sections/dimensions-and-remarks-section";
import { MachineSectionForm } from "./machine-section-form";

type Props = {
  machineUuid: string;
  defaultValues: MachineFormValues;
};

export const MachineDimensionsEditor = ({
  machineUuid,
  defaultValues,
}: Props) => (
  <MachineSectionForm
    machineUuid={machineUuid}
    defaultValues={defaultValues}
    save={updateMachineDimensions}
  >
    <DimensionsAndRemarksSection />
  </MachineSectionForm>
);
