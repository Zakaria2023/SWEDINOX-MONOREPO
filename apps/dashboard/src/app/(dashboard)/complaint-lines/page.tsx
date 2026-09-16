import { getComplaintLineOverview } from "@/app/(dashboard)/complaint-lines/actions";
import { complaintLineFilters } from "@/app/(dashboard)/complaint-lines/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { ComplaintLinesTable } from "@/components/complaint-lines/complaint-lines-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ComplaintLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getComplaintLineOverview(query);
  const companies = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <ComplaintLinesTable
        page={page}
        filters={complaintLineFilters(companies, products)}
      />
    </div>
  );
};

export default ComplaintLinesPage;
