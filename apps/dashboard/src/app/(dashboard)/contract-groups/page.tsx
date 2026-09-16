import { getContractGroupsList } from "@/app/(dashboard)/contract-groups/actions";
import { ContractGroups } from "@/components/contract-groups/contract-groups";

const ContractGroupsPage = async () => {
  const groups = await getContractGroupsList();

  return (
    <div className="space-y-4">
      <ContractGroups groups={groups} />
    </div>
  );
};

export default ContractGroupsPage;
