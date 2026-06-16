import { getCustomerGroups } from "@/app/(dashboard)/customer-groups/actions";
import { CustomerGroupsContent } from "./customer-groups-content";

export const CustomerGroupsTable = async () => {
  const groups = await getCustomerGroups();

  return <CustomerGroupsContent groups={groups} />;
};
