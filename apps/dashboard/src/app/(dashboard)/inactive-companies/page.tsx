import { getInactiveCompanies } from "@/app/(dashboard)/inactive-companies/actions";
import { INACTIVE_COMPANY_FILTER_CONTROLS } from "@/app/(dashboard)/inactive-companies/filters";
import { InactiveCompaniesTable } from "@/components/inactive-companies/inactive-companies-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const InactiveCompaniesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getInactiveCompanies(query);

  return (
    <div className="space-y-4">
      <InactiveCompaniesTable
        page={page}
        filters={INACTIVE_COMPANY_FILTER_CONTROLS}
      />
    </div>
  );
};

export default InactiveCompaniesPage;
