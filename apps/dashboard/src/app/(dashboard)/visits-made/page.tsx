import {
  getVisitRegions,
  getVisitsMade,
} from "@/app/(dashboard)/visits-made/actions";
import { visitMadeFilters } from "@/app/(dashboard)/visits-made/filters";
import { VisitsMadeTable } from "@/components/visits-made/visits-made-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const VisitsMadePage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getVisitsMade(query);
  const regions = await getVisitRegions();

  return (
    <div className="space-y-4">
      <VisitsMadeTable page={page} filters={visitMadeFilters(regions)} />
    </div>
  );
};

export default VisitsMadePage;
