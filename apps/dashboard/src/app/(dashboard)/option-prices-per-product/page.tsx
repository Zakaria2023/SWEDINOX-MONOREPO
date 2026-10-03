import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOptionPrices } from "@/app/(dashboard)/option-prices-per-product/actions";
import { OptionPricesTable } from "@/components/option-prices-per-product/option-prices-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OptionPricesPerProductPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const rows = await getOptionPrices(query);

  return <OptionPricesTable page={rows} />;
};

export default OptionPricesPerProductPage;
