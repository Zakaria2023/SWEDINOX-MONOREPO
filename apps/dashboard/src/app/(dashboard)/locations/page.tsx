import { Suspense } from "react";
import Link from "next/link";
import { LocationsTable } from "@/components/locations/locations-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const LocationsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Locations"
          description="Manage warehouse locations"
        />
        <Link
          href="/locations/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Location
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={5} />}>
        <LocationsTable />
      </Suspense>
    </div>
  );
};

export default LocationsPage;
