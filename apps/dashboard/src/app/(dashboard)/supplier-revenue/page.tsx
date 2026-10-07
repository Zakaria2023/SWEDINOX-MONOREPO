import {
  getSupplierRevenue,
  getSupplierRevenueYears,
} from "@/app/(dashboard)/supplier-revenue/actions";
import { supplierRevenueFilters } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/filters";
import { SupplierRevenueTable } from "@/components/supplier-revenue/supplier-revenue-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const SupplierRevenuePage = async ({ searchParams }: Props) => {
  // Sequential rather than concurrent: this database caps connections.
  const page = await getSupplierRevenue(parseTableQuery(await searchParams));
  const years = await getSupplierRevenueYears();

  return (
    <div className="space-y-4">
      <SupplierRevenueTable
        page={page}
        filters={supplierRevenueFilters(years, false)}
      />
    </div>
  );
};

export default SupplierRevenuePage;
