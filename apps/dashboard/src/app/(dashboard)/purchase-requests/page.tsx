import { Suspense } from "react";
import { PurchaseRequestsTable } from "@/components/purchase-requests/purchase-requests-table";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const PurchaseRequestsPage = () => (
  <Suspense fallback={<DataTableFallback columnCount={7} />}>
    <PurchaseRequestsTable />
  </Suspense>
);

export default PurchaseRequestsPage;
