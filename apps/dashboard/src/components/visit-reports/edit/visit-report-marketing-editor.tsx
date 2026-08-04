"use client";

import { IndustryOption } from "@/app/(dashboard)/industries/actions";
import { updateVisitReportMarketing } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { MarketingSection } from "../sections/marketing-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
  industries: IndustryOption[];
};

export const VisitReportMarketingEditor = ({
  visitReportUuid,
  defaultValues,
  industries,
}: Props) => (
  <VisitReportSectionForm
    visitReportUuid={visitReportUuid}
    defaultValues={defaultValues}
    save={updateVisitReportMarketing}
  >
    {(isPending) => (
      <MarketingSection isPending={isPending} industries={industries} />
    )}
  </VisitReportSectionForm>
);
