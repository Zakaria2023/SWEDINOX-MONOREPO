import { LocationForm } from "@/components/locations/location-form";

const AddLocationPage = () => {
  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Location</h1>
        <p className="mt-2 text-gray-600">Create a new warehouse location record</p>
      </div>
      <LocationForm />
    </div>
  );
};

export default AddLocationPage;
