import { getCountListDeviations } from "@/app/(dashboard)/count-list-deviations/actions";
import { COUNT_LIST_DEVIATION_FILTERS } from "@/app/(dashboard)/count-list-deviations/filters";
import { CountListDeviationsTable } from "@/components/count-list-deviations/count-list-deviations-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CountListDeviationsPage = async ({ searchParams }: Props) => {
  const page = await getCountListDeviations(
    parseTableQuery(await searchParams),
  );

  return (
    <div className="space-y-4">
      <CountListDeviationsTable
        page={page}
        filters={COUNT_LIST_DEVIATION_FILTERS}
      />
    </div>
  );
};

export default CountListDeviationsPage;
