import { getCounterOrders } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrdersTable } from "@/components/counter-orders/counter-orders-table-content";
import { counterOrderFilters } from "@/app/(dashboard)/counter-orders/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CounterOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const counterOrders = await getCounterOrders(query);
  const companies = await getCompaniesForSelect();

  return (
    <CounterOrdersTable
      page={counterOrders}
      filters={counterOrderFilters(companies)}
    />
  );
};

export default CounterOrdersPage;
