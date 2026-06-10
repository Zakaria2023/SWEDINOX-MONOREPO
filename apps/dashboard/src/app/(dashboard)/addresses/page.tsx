import { AddressesTable } from "@/components/addresses/addresses-table";

const AddressesPage = () => (
  <div className="space-y-6 p-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Addresses</h1>
      <p className="mt-2 text-gray-600">Address records and details</p>
    </div>

    <AddressesTable />
  </div>
);

export default AddressesPage;
