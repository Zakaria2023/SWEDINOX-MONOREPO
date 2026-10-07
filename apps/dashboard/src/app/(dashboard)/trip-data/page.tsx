import { getTripData, getTripYears } from "@/app/(dashboard)/trip-data/actions";
import { tripDataFilters } from "@/app/(dashboard)/trip-data/filters";
import { TripDataTable } from "@/components/trip-data/trip-data-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const TripDataPage = async ({ searchParams }: Props) => {
  // Sequential rather than concurrent: this database caps connections.
  const page = await getTripData(parseTableQuery(await searchParams));
  const years = await getTripYears();

  return (
    <div className="space-y-4">
      <TripDataTable page={page} filters={tripDataFilters(years)} />
    </div>
  );
};

export default TripDataPage;
