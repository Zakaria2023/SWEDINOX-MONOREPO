import { Suspense } from "react";
import { ContactGroupsTable } from "@/components/contact-groups/contact-groups-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContactGroupsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        titleKey="contact-groups-page.title"
        descriptionKey="contact-groups-page.description"
      />
      <Suspense
        fallback={<DataTableFallback columnCount={6} toolbarWidthClassName="w-32" />}
      >
        <ContactGroupsTable />
      </Suspense>
    </div>
  );
};

export default ContactGroupsPage;
