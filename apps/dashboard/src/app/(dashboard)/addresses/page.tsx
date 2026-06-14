import { Suspense } from "react";
import { AddressesTable } from "@/components/addresses/addresses-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const AddressesPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Addresses"
        description="Address records and details"
      />
      <Suspense fallback={<DataTableFallback columnCount={13} />}>
        <AddressesTable />
      </Suspense>
    </div>
  );
};

export default AddressesPage;
