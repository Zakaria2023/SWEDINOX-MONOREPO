import { getContractGroupsList } from "@/app/(dashboard)/contract-groups/actions";
import { ContractGroupsClient } from "@/components/contract-groups/contract-groups-client";

export const ContractGroupsTable = async () => {
  const groups = await getContractGroupsList();

  return <ContractGroupsClient groups={groups} />;
};
