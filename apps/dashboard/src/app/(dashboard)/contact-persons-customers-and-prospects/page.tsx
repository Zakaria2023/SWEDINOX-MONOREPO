import { Suspense } from "react";
import { ContactPersonsCustomersAndProspectsTable } from "@/components/contact-persons-customers-and-prospects/contact-persons-customers-and-prospects-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContactPersonsCustomersAndProspectsPage = () => (
  <div className="space-y-6 p-6">
    <PageHeading
      title="Contact Persons Customers and Prospects"
      description="Overview of all contact persons linked to customers and prospects"
    />
    <Suspense fallback={<DataTableFallback columnCount={12} />}>
      <ContactPersonsCustomersAndProspectsTable />
    </Suspense>
  </div>
);

export default ContactPersonsCustomersAndProspectsPage;
