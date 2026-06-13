import { Suspense } from "react";
import { ContractGroupsTable } from "@/components/contract-groups/contract-groups-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContractGroupsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        titleKey="contract-groups-page.title"
        descriptionKey="contract-groups-page.description"
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
