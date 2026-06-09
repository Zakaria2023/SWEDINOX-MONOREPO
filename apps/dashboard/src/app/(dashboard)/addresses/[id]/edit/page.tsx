import { getAddressById } from "@/app/(dashboard)/addresses/actions";
import { AddressForm } from "@/components/addresses/address-form";
import { unstable_noStore as noStore } from "next/cache";

type Params = Promise<{ id: string }>;

const EditAddressPage = async ({ params }: { params: Params }) => {
  noStore();

  const { id } = await params;
  const addressId = Number(id);
  const initialAddress = await getAddressById(addressId);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Address</h1>
        <p className="mt-2 text-gray-600">Update the address</p>
      </div>
      <AddressForm
        mode="edit"
        addressId={addressId}
        initialAddress={initialAddress}
      />
    </div>
  );
};

export default EditAddressPage;
