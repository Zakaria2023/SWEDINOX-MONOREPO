"use client";

import { updateVisitReportCategories } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { CategoriesSection } from "../sections/categories-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
};

export const VisitReportCategoriesEditor = ({ visitReportUuid, defaultValues }: Props) => (
  <VisitReportSectionForm
    visitReportUuid={visitReportUuid}
    defaultValues={defaultValues}
    save={updateVisitReportCategories}
  >
    {(isPending) => <CategoriesSection isPending={isPending} />}
  </VisitReportSectionForm>
);
