import { getOrderLines } from "@/app/(dashboard)/order-lines/actions";
import { orderLineFilters } from "@/app/(dashboard)/order-lines/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { OrderLinesTable } from "@/components/order-lines/order-lines-table-content";
import { getClerkUserNames } from "@/lib/server/clerk";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrderLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections, and the
  // page already costs two queries before the filter option lists.
  const rows = await getOrderLines(query);
  const companies = await getCompaniesForSelect();
  const products = await getProductsForSelect();
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <OrderLinesTable
        page={rows}
        filters={orderLineFilters(companies, products)}
        userNames={userNames}
      />
    </div>
  );
};

export default OrderLinesPage;
