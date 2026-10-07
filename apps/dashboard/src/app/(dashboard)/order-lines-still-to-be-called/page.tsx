import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOrderLinesStillToBeCalled } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import { callOffFilters } from "@/app/(dashboard)/orders-still-to-be-called/filters";
import { OrderLinesStillToBeCalledTable } from "@/components/order-lines-still-to-be-called/order-lines-still-to-be-called-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrderLinesStillToBeCalledPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const rows = await getOrderLinesStillToBeCalled(query);

  return (
    <div className="space-y-4">
      <OrderLinesStillToBeCalledTable page={rows} filters={callOffFilters()} />
    </div>
  );
};

export default OrderLinesStillToBeCalledPage;
