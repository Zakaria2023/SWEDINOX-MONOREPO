import { Suspense } from "react";
import { CompanyContactsTable } from "@/components/company-contacts/company-contacts-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const CompanyContactsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading titleKey="company-contacts-page.title" />
      <Suspense fallback={<DataTableFallback columnCount={7} />}>
        <CompanyContactsTable />
      </Suspense>
    </div>
  );
};

export default CompanyContactsPage;
