import { getVisitReports } from "@/app/(dashboard)/visit-reports/actions";
import { VisitReportsTableContent } from "@/components/visit-reports/visit-reports-table-content";

export const VisitReportsTable = async () => {
  const visitReports = await getVisitReports();

  return <VisitReportsTableContent visitReports={visitReports} />;
};
