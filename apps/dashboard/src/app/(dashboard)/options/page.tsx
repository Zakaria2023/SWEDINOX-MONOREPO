import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOptionLines } from "@/app/(dashboard)/options/actions";
import { optionLineFilters } from "@/app/(dashboard)/options/filters";
import { getSalesOptions } from "@/app/(dashboard)/option-prices-per-product/actions";
import { getRevenueGroupsForSelect } from "@/app/(dashboard)/products/actions";
import { OptionsTable } from "@/components/options/options-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OptionsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const rows = await getOptionLines(query);
  const options = await getSalesOptions();
  const revenueGroups = await getRevenueGroupsForSelect();

  return (
    <OptionsTable
      page={rows}
      filters={optionLineFilters(options, revenueGroups)}
    />
  );
};

export default OptionsPage;
