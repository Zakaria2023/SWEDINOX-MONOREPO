import { getLocations } from "@/app/(dashboard)/locations/actions";
import { LocationsTable } from "@/components/locations/locations-table-content";

const LocationsPage = async () => {
  const locations = await getLocations();

  return <LocationsTable locations={locations} />;
};

export default LocationsPage;
