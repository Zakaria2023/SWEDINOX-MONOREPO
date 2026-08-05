import { getOrdersAndQuotes } from "@/app/(dashboard)/orders-and-quotes/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { OrdersAndQuotesTable } from "@/components/orders-and-quotes/orders-and-quotes-table-content";

const OrdersAndQuotesPage = async () => {
  const rows = await getOrdersAndQuotes();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Orders and Quotes" />
      <OrdersAndQuotesTable rows={rows} />
    </div>
  );
};

export default OrdersAndQuotesPage;
