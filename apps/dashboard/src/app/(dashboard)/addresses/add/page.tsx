import { AddressForm } from "@/components/addresses/address-form";

const AddAddressPage = () => (
  <div className="max-w-4xl space-y-6 p-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Add Address</h1>
      <p className="mt-2 text-gray-600">Create a new company address</p>
    </div>
    <AddressForm />
  </div>
);

export default AddAddressPage;
