import { getRevenuePerProduct } from "@/app/(dashboard)/revenue-per-product/actions";
import { RevenuePerProductTable } from "@/components/revenue-per-product/revenue-per-product-table-content";
import { parseTableQuery, SearchParams, TableFilterControl } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const FILTERS: TableFilterControl[] = [
  { key: "invoiceDate", kind: "dateRange", label: "Invoice date" },
];

const RevenuePerProductPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getRevenuePerProduct(query);

  return (
    <div className="space-y-4">
      <RevenuePerProductTable page={page} filters={FILTERS} />
    </div>
  );
};

export default RevenuePerProductPage;
