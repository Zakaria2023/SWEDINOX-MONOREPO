import {
  getCustomerRevenuePerRevenueGroup,
  getRevenueGroupOptions,
} from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { customerRevenuePerRevenueGroupFilters } from "@/app/(dashboard)/customer-revenue-per-revenue-group/filters";
import { CustomerRevenuePerRevenueGroupTable } from "@/components/customer-revenue-per-revenue-group/customer-revenue-per-revenue-group-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerRevenuePerRevenueGroupPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerRevenuePerRevenueGroup(query);
  const revenueGroups = await getRevenueGroupOptions();

  return (
    <div className="space-y-4">
      <CustomerRevenuePerRevenueGroupTable
        page={page}
        filters={customerRevenuePerRevenueGroupFilters(revenueGroups)}
      />
    </div>
  );
};

export default CustomerRevenuePerRevenueGroupPage;
