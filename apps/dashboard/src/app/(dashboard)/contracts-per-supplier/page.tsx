import { Suspense } from "react";
import { ContractsPerSupplierTable } from "@/components/contracts-per-supplier/contracts-per-supplier-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContractsPerSupplierPage = () => (
  <div className="space-y-6 p-6">
    <PageHeading
      title="Contracts per Supplier"
      description="Overview of all contracts linked to suppliers"
    />
    <Suspense fallback={<DataTableFallback columnCount={9} />}>
      <ContractsPerSupplierTable />
    </Suspense>
  </div>
);

export default ContractsPerSupplierPage;
