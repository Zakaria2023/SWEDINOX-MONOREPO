import { getAddressesForSelect } from "@/app/(dashboard)/addresses/actions";
import { getLoadingLocations, getRootLocations } from "@/app/(dashboard)/locations/actions";
import { LocationForm } from "@/components/locations/location-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddLocationPage = async () => {
  const [loadingLocations, addresses, rootLocations] = await Promise.all([
    getLoadingLocations(),
    getAddressesForSelect(),
    getRootLocations(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        titleKey="locations-add-page.title"
        descriptionKey="locations-add-page.description"
      />
      <LocationForm loadingLocations={loadingLocations} addresses={addresses} rootLocations={rootLocations} />
    </div>
  );
};

export default AddLocationPage;
