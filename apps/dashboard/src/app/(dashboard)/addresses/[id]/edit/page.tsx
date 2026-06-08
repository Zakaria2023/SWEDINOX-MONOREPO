import { AddressForm } from "../../components/address-form";

type Params = Promise<{ id: string }>;

const EditAddressPage = async ({ params }: { params: Params }) => {
  const { id } = await params;

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Address</h1>
        <p className="mt-2 text-gray-600">Update the company address</p>
      </div>
      <AddressForm mode="edit" addressId={Number(id)} />
    </div>
  );
};

export default EditAddressPage;
