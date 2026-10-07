import { getSupplierRevenueYears } from "@/app/(dashboard)/supplier-revenue/actions";
import { getSupplierRevenuePerRevenueGroup } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import { supplierRevenueFilters } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/filters";
import { SupplierRevenuePerGroupTable } from "@/components/supplier-revenue-per-revenue-group/supplier-revenue-per-revenue-group-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const SupplierRevenuePerRevenueGroupPage = async ({ searchParams }: Props) => {
  // Sequential rather than concurrent: this database caps connections.
  const page = await getSupplierRevenuePerRevenueGroup(
    parseTableQuery(await searchParams),
  );
  const years = await getSupplierRevenueYears();

  return (
    <div className="space-y-4">
      <SupplierRevenuePerGroupTable
        page={page}
        filters={supplierRevenueFilters(years, true)}
      />
    </div>
  );
};

export default SupplierRevenuePerRevenueGroupPage;
