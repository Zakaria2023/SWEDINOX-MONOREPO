import { getCompanyOptions } from "@/app/(dashboard)/companies/actions";
import { AddressForm } from "@/components/addresses/address-form";
import { unstable_noStore as noStore } from "next/cache";

const AddAddressPage = async () => {
  noStore();

  const companyOptionsResult = await getCompanyOptions();
  const companyOptions = companyOptionsResult.data.map((company) => ({
    label: company.companyName,
    value: company.uuid,
  }));

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Address</h1>
        <p className="mt-2 text-gray-600">Create a new company address</p>
      </div>
      <AddressForm
        companyOptions={companyOptions}
        companyOptionsError={companyOptionsResult.error}
      />
    </div>
  );
};

export default AddAddressPage;
