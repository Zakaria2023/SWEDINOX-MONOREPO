"use client";

import { updateMachineDocuments } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { DocumentsSection } from "../sections/documents-section";
import { MachineSectionForm } from "./machine-section-form";

type Props = {
  machineUuid: string;
  defaultValues: MachineFormValues;
};

export const MachineDocumentsEditor = ({
  machineUuid,
  defaultValues,
}: Props) => (
  <MachineSectionForm
    machineUuid={machineUuid}
    defaultValues={defaultValues}
    save={updateMachineDocuments}
  >
    <DocumentsSection />
  </MachineSectionForm>
);
