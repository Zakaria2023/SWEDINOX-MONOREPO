import { getTripData } from "@/app/(dashboard)/trip-data/actions";
import { TRIP_DATA_FILTERS } from "@/app/(dashboard)/trip-data/filters";
import { TripDataTable } from "@/components/trip-data/trip-data-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const TripDataPage = async ({ searchParams }: Props) => {
  const page = await getTripData(parseTableQuery(await searchParams));

  return (
    <div className="space-y-4">
      <TripDataTable page={page} filters={TRIP_DATA_FILTERS} />
    </div>
  );
};

export default TripDataPage;
