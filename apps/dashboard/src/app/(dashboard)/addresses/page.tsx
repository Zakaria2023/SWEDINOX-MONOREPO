import { getAddresses } from "@/app/(dashboard)/addresses/actions";
import { AddressesTable } from "@/components/addresses/addresses-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const AddressesPage = async () => {
  const addresses = await getAddresses();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Addresses" />
      <AddressesTable addresses={addresses} />
    </div>
  );
};

export default AddressesPage;
