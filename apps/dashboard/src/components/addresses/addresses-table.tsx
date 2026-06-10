import { getAddresses } from "@/app/(dashboard)/addresses/actions";
import { AddressesTableContent } from "@/components/addresses/addresses-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const AddressesTable = async () => {
  noStore();

  const addresses = await getAddresses();

  return <AddressesTableContent addresses={addresses} />;
};
