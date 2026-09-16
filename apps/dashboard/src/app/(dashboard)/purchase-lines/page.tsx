import { getPurchaseLines } from "@/app/(dashboard)/purchase-lines/actions";
import { PurchaseLinesTable } from "@/components/purchase-lines/purchase-lines-table-content";
import { purchaseLineFilters } from "@/app/(dashboard)/purchase-lines/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const lines = await getPurchaseLines(query);
  const suppliers = await getCompaniesForSelect();
  const purchasers = await getClerkUsersForSelect();
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <PurchaseLinesTable
        page={lines}
        filters={purchaseLineFilters(suppliers, purchasers, products)}
      />
    </div>
  );
};

export default PurchaseLinesPage;
