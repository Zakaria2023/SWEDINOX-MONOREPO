import { getVisitReports } from "@/app/(dashboard)/visit-reports/actions";
import { VisitReportsTable } from "@/components/visit-reports/visit-reports-table-content";
import { visitReportFilters } from "@/app/(dashboard)/visit-reports/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const VisitReportsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const visitReports = await getVisitReports(query);
  const companies = await getCompaniesForSelect();

  return (
    <VisitReportsTable
      page={visitReports}
      filters={visitReportFilters(companies)}
    />
  );
};

export default VisitReportsPage;
