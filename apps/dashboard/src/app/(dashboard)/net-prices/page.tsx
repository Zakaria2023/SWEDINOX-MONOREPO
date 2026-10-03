import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForSelect } from "@/app/(dashboard)/contracts/actions";
import { getNetPrices } from "@/app/(dashboard)/net-prices/actions";
import { netPriceFilters } from "@/app/(dashboard)/net-prices/filters";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { NetPricesTable } from "@/components/net-prices/net-prices-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const NetPricesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getNetPrices(query);
  const contracts = await getContractsForSelect();
  const companies = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <NetPricesTable
      page={page}
      filters={netPriceFilters(contracts, companies, products)}
    />
  );
};

export default NetPricesPage;
