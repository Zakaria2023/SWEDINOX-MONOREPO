import { getAddressDistances } from "@/app/(dashboard)/address-distances/actions";
import { AddressDistancesTableContent } from "@/components/address-distances/address-distances-table-content";

export const AddressDistancesTable = async () => {
  const addressDistances = await getAddressDistances();

  return <AddressDistancesTableContent addressDistances={addressDistances} />;
};
