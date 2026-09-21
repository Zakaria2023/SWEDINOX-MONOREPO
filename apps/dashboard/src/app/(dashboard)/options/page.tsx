import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOptionRevenue } from "@/app/(dashboard)/options/actions";
import { GenerateOptionChargesButton } from "@/components/options/generate-option-charges-button";
import { OptionsTable } from "@/components/options/options-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OptionsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const rows = await getOptionRevenue(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <GenerateOptionChargesButton />
      </div>
      <OptionsTable page={rows} />
    </div>
  );
};

export default OptionsPage;
