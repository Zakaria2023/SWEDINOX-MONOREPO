import {
  getCustomerRevenuePerProductGroup,
  getRevenueTransportRegions,
} from "@/app/(dashboard)/customer-revenue-per-product-group/actions";
import { customerRevenuePerProductGroupFilters } from "@/app/(dashboard)/customer-revenue-per-product-group/filters";
import { getCustomerOverviewRegions } from "@/app/(dashboard)/customer-overview/actions";
import { CustomerRevenuePerProductGroupTable } from "@/components/customer-revenue-per-product-group/customer-revenue-per-product-group-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerRevenuePerProductGroupPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerRevenuePerProductGroup(query);
  const regions = await getCustomerOverviewRegions();
  const transportRegions = await getRevenueTransportRegions();

  return (
    <div className="space-y-4">
      <CustomerRevenuePerProductGroupTable
        page={page}
        filters={customerRevenuePerProductGroupFilters(
          regions,
          transportRegions,
        )}
      />
    </div>
  );
};

export default CustomerRevenuePerProductGroupPage;
