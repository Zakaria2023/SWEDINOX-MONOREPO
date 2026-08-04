"use client";

import { updateVisitReportVisitPlanning } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { VisitPlanningSection } from "../sections/visit-planning-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
};

export const VisitReportPlanningEditor = ({ visitReportUuid, defaultValues }: Props) => (
  <VisitReportSectionForm
    visitReportUuid={visitReportUuid}
    defaultValues={defaultValues}
    save={updateVisitReportVisitPlanning}
  >
    {(isPending) => <VisitPlanningSection isPending={isPending} />}
  </VisitReportSectionForm>
);
