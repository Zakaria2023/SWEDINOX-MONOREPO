import { getLocations } from "@/app/(dashboard)/locations/actions";
import { LocationsTableContent } from "@/components/locations/locations-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const LocationsTable = async () => {
  noStore();

  const locations = await getLocations();

  return <LocationsTableContent locations={locations} />;
};
