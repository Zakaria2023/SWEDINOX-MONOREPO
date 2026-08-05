import { getContractGroupsList } from "@/app/(dashboard)/contract-groups/actions";
import { ContractGroups } from "@/components/contract-groups/contract-groups";
import { PageHeading } from "@/components/layout/page-heading";

const ContractGroupsPage = async () => {
  const groups = await getContractGroupsList();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Contract Groups" />
      <ContractGroups groups={groups} />
    </div>
  );
};

export default ContractGroupsPage;
