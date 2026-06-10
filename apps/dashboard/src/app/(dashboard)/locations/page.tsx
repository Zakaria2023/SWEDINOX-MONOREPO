import Link from "next/link";
import { LocationsTable } from "@/components/locations/locations-table";

const LocationsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
        <p className="mt-2 text-gray-600">Manage warehouse location records</p>
      </div>
      <Link
        href="/locations/add"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Location
      </Link>
    </div>

    <LocationsTable />
  </div>
);

export default LocationsPage;
