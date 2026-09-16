import { getAddressDistances } from "@/app/(dashboard)/address-distances/actions";
import { AddressDistancesTable } from "@/components/address-distances/address-distances-table-content";

const AddressDistancesPage = async () => {
  const addressDistances = await getAddressDistances();

  return (
    <div className="space-y-4">
      <AddressDistancesTable addressDistances={addressDistances} />
    </div>
  );
};

export default AddressDistancesPage;
