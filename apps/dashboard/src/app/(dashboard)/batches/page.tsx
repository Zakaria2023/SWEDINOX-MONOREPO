import { getBatches } from "@/app/(dashboard)/batches/actions";
import { batchFilters } from "@/app/(dashboard)/batches/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { BatchesTable } from "@/components/batches/batches-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const BatchesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getBatches(query);
  const suppliers = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <BatchesTable page={page} filters={batchFilters(suppliers, products)} />
    </div>
  );
};

export default BatchesPage;
