import { getOrdersAndQuotes } from "@/app/(dashboard)/orders-and-quotes/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";
import { OrdersAndQuotesTable } from "@/components/orders-and-quotes/orders-and-quotes-table-content";

const OrdersAndQuotesPage = async () => {
  const rows = await getOrdersAndQuotes();
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <PageHeading title="Orders and Quotes" />
      <OrdersAndQuotesTable rows={rows} userNames={userNames} />
    </div>
  );
};

export default OrdersAndQuotesPage;
