"use client";

import { updateVisitReportDetails } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { DetailsSection } from "../sections/details-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
};

export const VisitReportDetailsEditor = ({ visitReportUuid, defaultValues }: Props) => (
  <VisitReportSectionForm
    visitReportUuid={visitReportUuid}
    defaultValues={defaultValues}
    save={updateVisitReportDetails}
  >
    {(isPending) => <DetailsSection isPending={isPending} />}
  </VisitReportSectionForm>
);
