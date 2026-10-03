import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getOrders } from "@/app/(dashboard)/orders/actions";
import { orderFilters } from "@/app/(dashboard)/orders/filters";
import { OrdersTable } from "@/components/orders/orders-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const orders = await getOrders(query);
  const companies = await getCompaniesForSelect();

  return <OrdersTable page={orders} filters={orderFilters(companies)} />;
};

export default OrdersPage;
