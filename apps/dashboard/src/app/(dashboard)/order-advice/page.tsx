import { getOrderAdvice } from "@/app/(dashboard)/order-advice/actions";
import { OrderAdviceFilter } from "@/components/order-advice/order-advice-filter";
import { OrderAdviceTable } from "@/components/order-advice/order-advice-table-content";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<{ productCode?: string; onlyAdvised?: string }>;
};

const OrderAdvicePage = async ({ searchParams }: Props) => {
  const { productCode, onlyAdvised } = await searchParams;
  const onlyAdvisedFlag = onlyAdvised === "1";
  const rows = await getOrderAdvice({
    productCode: productCode || undefined,
    onlyAdvised: onlyAdvisedFlag,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Order advice"
        description="Advised purchase quantities per stock product, from stock policy, open orders and invoiced demand"
      />
      <OrderAdviceFilter
        productCode={productCode}
        onlyAdvised={onlyAdvisedFlag}
      />
      <OrderAdviceTable rows={rows} />
    </div>
  );
};

export default OrderAdvicePage;
