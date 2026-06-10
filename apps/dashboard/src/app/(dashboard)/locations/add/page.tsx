import { getLoadingLocations } from "@/app/(dashboard)/locations/actions";
import { getAddressesForSelect } from "@/app/(dashboard)/addresses/actions";
import { LocationForm } from "@/components/locations/location-form";

const AddLocationPage = async () => {
  const [loadingLocations, addresses] = await Promise.all([
    getLoadingLocations(),
    getAddressesForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Location</h1>
        <p className="mt-2 text-gray-600">Create a new warehouse location record</p>
      </div>
      <LocationForm loadingLocations={loadingLocations} addresses={addresses} />
    </div>
  );
};

export default AddLocationPage;
