import { getContactPersonsSuppliers } from "@/app/(dashboard)/contact-persons-suppliers/actions";
import { ContactPersonsSuppliersTable } from "@/components/contact-persons-suppliers/contact-persons-suppliers-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ContactPersonsSuppliersPage = async () => {
  const rows = await getContactPersonsSuppliers();

  return (
    <div className="space-y-4">
      <PageHeading title="Contact Persons Suppliers" />
      <ContactPersonsSuppliersTable rows={rows} />
    </div>
  );
};

export default ContactPersonsSuppliersPage;
