import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getPurchaseReceivals } from "@/app/(dashboard)/purchase-receivals/actions";
import { purchaseReceivalFilters } from "@/app/(dashboard)/purchase-receivals/filters";
import { PurchaseReceivalsTable } from "@/components/purchase-receivals/purchase-receivals-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseReceivalsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getPurchaseReceivals(query);
  const suppliers = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <PurchaseReceivalsTable
        page={page}
        filters={purchaseReceivalFilters(suppliers, products)}
      />
    </div>
  );
};

export default PurchaseReceivalsPage;
