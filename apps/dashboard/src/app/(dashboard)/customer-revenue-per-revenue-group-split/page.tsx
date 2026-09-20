import { getRevenueGroupOptions } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { getCustomerRevenueSplit } from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/actions";
import { customerRevenueSplitFilters } from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/filters";
import { CustomerRevenueSplitTable } from "@/components/customer-revenue-per-revenue-group-split/customer-revenue-split-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerRevenueSplitPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerRevenueSplit(query);
  const revenueGroups = await getRevenueGroupOptions();

  return (
    <div className="space-y-4">
      <CustomerRevenueSplitTable
        page={page}
        filters={customerRevenueSplitFilters(revenueGroups)}
      />
    </div>
  );
};

export default CustomerRevenueSplitPage;
