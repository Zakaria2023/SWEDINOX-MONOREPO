"use client";

import { updateVisitReportReaders } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { DashboardUserOption } from "@/lib/server/clerk";
import { ReadersSection } from "../sections/readers-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
  adminUsers: DashboardUserOption[];
};

export const VisitReportReadersEditor = ({
  visitReportUuid,
  defaultValues,
  adminUsers,
}: Props) => (
  <VisitReportSectionForm
    visitReportUuid={visitReportUuid}
    defaultValues={defaultValues}
    save={updateVisitReportReaders}
  >
    {(isPending) => (
      <ReadersSection isPending={isPending} adminUsers={adminUsers} />
    )}
  </VisitReportSectionForm>
);
