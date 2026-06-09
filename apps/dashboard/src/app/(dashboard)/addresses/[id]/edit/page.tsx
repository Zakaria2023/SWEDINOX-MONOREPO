import { getAddressById } from "@/app/(dashboard)/addresses/actions";
import { getCompanyOptions } from "@/app/(dashboard)/companies/actions";
import { AddressForm } from "@/components/addresses/address-form";
import { unstable_noStore as noStore } from "next/cache";

type Params = Promise<{ id: string }>;

const EditAddressPage = async ({ params }: { params: Params }) => {
  noStore();

  const { id } = await params;
  const addressId = Number(id);
  const [initialAddress, companyOptionsResult] = await Promise.all([
    getAddressById(addressId),
    getCompanyOptions(),
  ]);
  const companyOptions = companyOptionsResult.data.map((company) => ({
    label: company.companyName,
    value: company.uuid,
  }));

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Address</h1>
        <p className="mt-2 text-gray-600">Update the company address</p>
      </div>
      <AddressForm
        mode="edit"
        addressId={addressId}
        initialAddress={initialAddress}
        companyOptions={companyOptions}
        companyOptionsError={companyOptionsResult.error}
      />
    </div>
  );
};

export default EditAddressPage;
