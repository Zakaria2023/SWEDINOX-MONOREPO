import { getContractGroupsList } from "@/app/(dashboard)/contract-groups/actions";
import { ContractGroupsClient } from "@/components/contract-groups/contract-groups-client";
import { unstable_noStore as noStore } from "next/cache";

export const ContractGroupsTable = async () => {
  noStore();

  const groups = await getContractGroupsList();

  return <ContractGroupsClient groups={groups} />;
};
