import { Suspense } from "react";
import { AddressForm } from "../components/address-form";

const AddAddressPage = () => (
  <div className="max-w-4xl space-y-6 p-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Add Address</h1>
      <p className="mt-2 text-gray-600">Create a new company address</p>
    </div>
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading form...</div>}>
      <AddressForm />
    </Suspense>
  </div>
);

export default AddAddressPage;
