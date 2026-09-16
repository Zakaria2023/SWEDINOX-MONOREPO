import { getTripData } from "@/app/(dashboard)/trip-data/actions";
import { TripDataTable } from "@/components/trip-data/trip-data-table-content";

const TripDataPage = async () => {
  const trips = await getTripData();

  return (
    <div className="space-y-4">
      <TripDataTable trips={trips} />
    </div>
  );
};

export default TripDataPage;
