import { getLocations } from "@/app/(dashboard)/locations/actions";
import { LocationsTableContent } from "@/components/locations/locations-table-content";

export const LocationsTable = async () => {
  const locations = await getLocations();

  return <LocationsTableContent locations={locations} />;
};
