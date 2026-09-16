import Link from "next/link";
import { Plus } from "lucide-react";
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
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/visit-reports/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Visit Report
        </Link>
      </div>
      <VisitReportsTable
        page={visitReports}
        filters={visitReportFilters(companies)}
      />
    </div>
  );
};

export default VisitReportsPage;
