import Link from "next/link";
import { getLocations } from "@/app/(dashboard)/locations/actions";
import { LocationsTable } from "@/components/locations/locations-table-content";

const LocationsPage = async () => {
  const locations = await getLocations();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/locations/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Location
        </Link>
      </div>
      <LocationsTable locations={locations} />
    </div>
  );
};

export default LocationsPage;
