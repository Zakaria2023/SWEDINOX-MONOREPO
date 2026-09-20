import {
  getCustomerOverview,
  getCustomerOverviewRegions,
} from "@/app/(dashboard)/customer-overview/actions";
import { customerOverviewFilters } from "@/app/(dashboard)/customer-overview/filters";
import { CustomerOverviewTable } from "@/components/customer-overview/customer-overview-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerOverviewPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerOverview(query);
  const regions = await getCustomerOverviewRegions();

  return (
    <div className="space-y-4">
      <CustomerOverviewTable
        page={page}
        filters={customerOverviewFilters(regions)}
      />
    </div>
  );
};

export default CustomerOverviewPage;
