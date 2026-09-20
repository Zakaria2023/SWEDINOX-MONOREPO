import { getOrdersAndQuotes } from "@/app/(dashboard)/orders-and-quotes/actions";
import { ORDER_OR_QUOTE_FILTER_CONTROLS } from "@/app/(dashboard)/orders-and-quotes/filters";
import { OrdersAndQuotesTable } from "@/components/orders-and-quotes/orders-and-quotes-table-content";
import { getClerkUserNames } from "@/lib/server/clerk";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrdersAndQuotesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getOrdersAndQuotes(query);
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <OrdersAndQuotesTable
        page={page}
        userNames={userNames}
        filters={ORDER_OR_QUOTE_FILTER_CONTROLS}
      />
    </div>
  );
};

export default OrdersAndQuotesPage;
