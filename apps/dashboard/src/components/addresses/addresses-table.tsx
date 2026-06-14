import { getAddresses } from "@/app/(dashboard)/addresses/actions";
import { AddressesTableContent } from "@/components/addresses/addresses-table-content";

export const AddressesTable = async () => {
  const addresses = await getAddresses();

  return <AddressesTableContent addresses={addresses} />;
};
