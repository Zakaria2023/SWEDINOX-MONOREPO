import { Suspense } from "react";
import { ContractGroupsTable } from "@/components/contract-groups/contract-groups-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContractGroupsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Contract Groups"
        description="Manage groups that can be assigned to contracts."
      />
      <Suspense
        fallback={<DataTableFallback columnCount={6} toolbarWidthClassName="w-32" />}
      >
        <ContractGroupsTable />
      </Suspense>
    </div>
  );
};

export default ContractGroupsPage;
