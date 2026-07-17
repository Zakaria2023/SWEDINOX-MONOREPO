import { getStockOnAdvice } from "@/app/(dashboard)/stockon-advice/actions";
import { StockOnAdviceFilter } from "@/components/stockon-advice/stockon-advice-filter";
import { StockOnAdviceTable } from "@/components/stockon-advice/stockon-advice-table-content";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<{ productCode?: string; onlyAdvised?: string }>;
};

const StockOnAdvicePage = async ({ searchParams }: Props) => {
  const { productCode, onlyAdvised } = await searchParams;
  const onlyAdvisedFlag = onlyAdvised === "1";
  const rows = await getStockOnAdvice({
    productCode: productCode || undefined,
    onlyAdvised: onlyAdvisedFlag,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="StockOn advice"
        description="Periodic-review reorder for StockOp-enabled products: order-up-to level from lead time and review period, with a daily order decision"
      />
      <StockOnAdviceFilter
        productCode={productCode}
        onlyAdvised={onlyAdvisedFlag}
      />
      <StockOnAdviceTable rows={rows} />
    </div>
  );
};

export default StockOnAdvicePage;
