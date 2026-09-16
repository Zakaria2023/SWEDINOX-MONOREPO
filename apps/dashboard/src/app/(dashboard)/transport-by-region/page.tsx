import {
  getTransportByRegion,
  getTransportRegions,
} from "@/app/(dashboard)/transport-by-region/actions";
import { transportByRegionFilters } from "@/app/(dashboard)/transport-by-region/filters";
import { TransportByRegionTable } from "@/components/transport-by-region/transport-by-region-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const TransportByRegionPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getTransportByRegion(query);
  const regions = await getTransportRegions();

  return (
    <div className="space-y-4">
      <TransportByRegionTable
        page={page}
        filters={transportByRegionFilters(regions)}
      />
    </div>
  );
};

export default TransportByRegionPage;
