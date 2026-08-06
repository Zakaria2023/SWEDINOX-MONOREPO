import { getPurchaseLines } from "@/app/(dashboard)/purchase-lines/actions";
import { PurchaseLinesTable } from "@/components/purchase-lines/purchase-lines-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { purchaseLineFilters } from "@/app/(dashboard)/purchase-lines/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const lines = await getPurchaseLines(query);
  const suppliers = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <PageHeading title="Purchase lines" />
      <PurchaseLinesTable
        page={lines}
        filters={purchaseLineFilters(suppliers, products)}
      />
    </div>
  );
};

export default PurchaseLinesPage;
