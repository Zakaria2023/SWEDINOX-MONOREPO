import { getStockOnAdvice } from "@/app/(dashboard)/stockon-advice/actions";
import { StockOnAdviceTable } from "@/components/stockon-advice/stockon-advice-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const StockOnAdvicePage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getStockOnAdvice(query);

  return (
    <div className="space-y-4">
      <StockOnAdviceTable page={page} />
    </div>
  );
};

export default StockOnAdvicePage;
