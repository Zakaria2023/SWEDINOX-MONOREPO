import { getContractGroupsList } from "@/app/(dashboard)/contract-groups/actions";
import { ContractGroupsClient } from "@/components/contract-groups/contract-groups-client";
import { PageHeading } from "@/components/layout/page-heading";

const ContractGroupsPage = async () => {
  const groups = await getContractGroupsList();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Contract Groups"
        description="Manage groups that can be assigned to contracts."
      />
      <ContractGroupsClient groups={groups} />
    </div>
  );
};

export default ContractGroupsPage;
