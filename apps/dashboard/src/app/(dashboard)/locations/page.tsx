import { LocationsTable } from "@/components/locations/locations-table";
import { PageHeading } from "@/components/layout/page-heading";
import { TranslatedLink } from "@/components/layout/translated-link";

const LocationsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          titleKey="locations-page.title"
          descriptionKey="locations-page.description"
        />
        <div className="flex gap-2">
          <TranslatedLink
            href="/locations/add"
            labelKey="locations-page.new-location"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          />
          <TranslatedLink
            href="/locations/add-sub"
            labelKey="locations-page.new-sub-location"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          />
        </div>
      </div>
      <LocationsTable />
    </div>
  );
};

export default LocationsPage;
