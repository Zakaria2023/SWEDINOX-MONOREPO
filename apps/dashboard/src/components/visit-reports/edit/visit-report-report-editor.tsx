"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { updateVisitReportReport } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { DashboardUserOption } from "@/lib/server/clerk";
import { VisitReportSection } from "../sections/visit-report-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
  companies: CompanyOption[];
  adminUsers: DashboardUserOption[];
};

export const VisitReportReportEditor = ({
  visitReportUuid,
  defaultValues,
  companies,
  adminUsers,
}: Props) => (
  <VisitReportSectionForm
    visitReportUuid={visitReportUuid}
    defaultValues={defaultValues}
    save={updateVisitReportReport}
  >
    {(isPending) => (
      <VisitReportSection
        isPending={isPending}
        companies={companies}
        adminUsers={adminUsers}
        // Moving a report to another company would orphan the contact picked
        // from the old one, so the contact is cleared with the company.
        onCompanyChange={(value, fieldOnChange) => fieldOnChange(value)}
      />
    )}
  </VisitReportSectionForm>
);
