import { getStockMovements } from "@/app/(dashboard)/stock-movements/actions";
import { stockMovementFilters } from "@/app/(dashboard)/stock-movements/filters";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { StockMovementsTable } from "@/components/stock-movements/stock-movements-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const StockMovementsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const stockMovements = await getStockMovements(query);
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <StockMovementsTable
        page={stockMovements}
        filters={stockMovementFilters(products)}
      />
    </div>
  );
};

export default StockMovementsPage;
