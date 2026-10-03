import { getReturnOrders } from "@/app/(dashboard)/return-orders/actions";
import { ReturnOrdersTable } from "@/components/return-orders/return-orders-table-content";
import { returnOrderFilters } from "@/app/(dashboard)/return-orders/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ReturnOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const returnOrders = await getReturnOrders(query);
  const companies = await getCompaniesForSelect();

  return (
    <ReturnOrdersTable
      page={returnOrders}
      filters={returnOrderFilters(companies)}
    />
  );
};

export default ReturnOrdersPage;
