import { getAddressDistances } from "@/app/(dashboard)/address-distances/actions";
import { AddressDistancesTable } from "@/components/address-distances/address-distances-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const AddressDistancesPage = async () => {
  const addressDistances = await getAddressDistances();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Address Distances" />
      <AddressDistancesTable addressDistances={addressDistances} />
    </div>
  );
};

export default AddressDistancesPage;
