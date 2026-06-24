import { Suspense } from "react";
import { ContactPersonsSuppliersTable } from "@/components/contact-persons-suppliers/contact-persons-suppliers-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContactPersonsSuppliersPage = () => (
  <div className="space-y-6 p-6">
    <PageHeading
      title="Contact Persons Suppliers"
      description="Overview of all contact persons linked to suppliers"
    />
    <Suspense fallback={<DataTableFallback columnCount={12} />}>
      <ContactPersonsSuppliersTable />
    </Suspense>
  </div>
);

export default ContactPersonsSuppliersPage;
