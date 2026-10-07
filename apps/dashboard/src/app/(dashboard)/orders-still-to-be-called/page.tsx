import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOrdersStillToBeCalled } from "@/app/(dashboard)/orders-still-to-be-called/actions";
import { callOffFilters } from "@/app/(dashboard)/orders-still-to-be-called/filters";
import { OrdersStillToBeCalledTable } from "@/components/orders-still-to-be-called/orders-still-to-be-called-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrdersStillToBeCalledPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const rows = await getOrdersStillToBeCalled(query);

  return (
    <div className="space-y-4">
      <OrdersStillToBeCalledTable page={rows} filters={callOffFilters()} />
    </div>
  );
};

export default OrdersStillToBeCalledPage;
