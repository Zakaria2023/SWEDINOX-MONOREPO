import { getRevenueGroupOptions } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { getCustomerRevenueSalesVisits } from "@/app/(dashboard)/customer-revenue-sales-and-visits/actions";
import { customerRevenueSalesVisitsFilters } from "@/app/(dashboard)/customer-revenue-sales-and-visits/filters";
import { CustomerRevenueSalesVisitsTable } from "@/components/customer-revenue-sales-and-visits/customer-revenue-sales-and-visits-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerRevenueSalesVisitsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerRevenueSalesVisits(query);
  const revenueGroups = await getRevenueGroupOptions();

  return (
    <div className="space-y-4">
      <CustomerRevenueSalesVisitsTable
        page={page}
        filters={customerRevenueSalesVisitsFilters(revenueGroups)}
      />
    </div>
  );
};

export default CustomerRevenueSalesVisitsPage;
