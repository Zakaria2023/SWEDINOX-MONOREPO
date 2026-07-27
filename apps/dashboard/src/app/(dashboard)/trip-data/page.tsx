import { getTripData } from "@/app/(dashboard)/trip-data/actions";
import { TripDataTable } from "@/components/trip-data/trip-data-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TripDataPage = async () => {
  const trips = await getTripData();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Trip data"
        description="Transport trips with stops, load and orders per stop"
      />
      <TripDataTable trips={trips} />
    </div>
  );
};

export default TripDataPage;
