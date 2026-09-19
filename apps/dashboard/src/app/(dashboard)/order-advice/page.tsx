import {
  getOrderAdvice,
  getOrderAdviceCodes,
  getOrderAdviceSuppliers,
} from "@/app/(dashboard)/order-advice/actions";
import { orderAdviceFilters } from "@/app/(dashboard)/order-advice/filters";
import { OrderAdviceTable } from "@/components/order-advice/order-advice-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrderAdvicePage = async ({ searchParams }: Props) => {
  const page = await getOrderAdvice(parseTableQuery(await searchParams));
  const suppliers = await getOrderAdviceSuppliers();
  const adviceCodes = await getOrderAdviceCodes();

  return (
    <div className="space-y-4">
      <OrderAdviceTable
        page={page}
        filters={orderAdviceFilters(suppliers, adviceCodes)}
      />
    </div>
  );
};

export default OrderAdvicePage;
