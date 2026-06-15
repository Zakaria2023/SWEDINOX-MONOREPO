import { Suspense } from "react";
import { AddressDistancesTable } from "@/components/address-distances/address-distances-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const AddressDistancesPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Address Distances"
        description="Distance records between company addresses."
      />
      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <AddressDistancesTable />
      </Suspense>
    </div>
  );
};

export default AddressDistancesPage;
