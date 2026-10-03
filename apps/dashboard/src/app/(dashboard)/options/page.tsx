import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOptionRevenue } from "@/app/(dashboard)/options/actions";
import { OptionsTable } from "@/components/options/options-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OptionsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const rows = await getOptionRevenue(query);

  return <OptionsTable page={rows} />;
};

export default OptionsPage;
