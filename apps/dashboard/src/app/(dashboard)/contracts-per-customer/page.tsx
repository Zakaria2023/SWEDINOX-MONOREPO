import { Suspense } from "react";
import { ContractsPerCustomerTable } from "@/components/contracts-per-customer/contracts-per-customer-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContractsPerCustomerPage = () => (
  <div className="space-y-6 p-6">
    <PageHeading
      title="Contracts per Customer / Prospect"
      description="Overview of all contracts linked to customers and prospects"
    />
    <Suspense fallback={<DataTableFallback columnCount={14} />}>
      <ContractsPerCustomerTable />
    </Suspense>
  </div>
);

export default ContractsPerCustomerPage;
