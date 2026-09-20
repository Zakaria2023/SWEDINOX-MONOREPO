import {
  getCustomerRevenue,
  getCustomerRevenueYears,
} from "@/app/(dashboard)/customer-revenue/actions";
import { customerRevenueFilters } from "@/app/(dashboard)/customer-revenue/filters";
import { CustomerRevenueTable } from "@/components/customer-revenue/customer-revenue-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerRevenuePage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerRevenue(query);
  const years = await getCustomerRevenueYears();

  return (
    <div className="space-y-4">
      <CustomerRevenueTable
        page={page}
        filters={customerRevenueFilters(years)}
      />
    </div>
  );
};

export default CustomerRevenuePage;
