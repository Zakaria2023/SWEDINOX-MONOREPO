import { Suspense } from "react";
import { CustomerGroupsTable } from "@/components/customer-groups/customer-groups-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const CustomerGroupsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer Groups"
        description="Manage groups that can be assigned to customers."
      />
      <Suspense fallback={<DataTableFallback columnCount={3} toolbarWidthClassName="w-32" />}>
        <CustomerGroupsTable />
      </Suspense>
    </div>
  );
};

export default CustomerGroupsPage;
