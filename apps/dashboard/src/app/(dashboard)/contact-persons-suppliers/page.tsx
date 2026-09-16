import { getContactPersonsSuppliers } from "@/app/(dashboard)/contact-persons-suppliers/actions";
import { ContactPersonsSuppliersTable } from "@/components/contact-persons-suppliers/contact-persons-suppliers-table-content";

const ContactPersonsSuppliersPage = async () => {
  const rows = await getContactPersonsSuppliers();

  return (
    <div className="space-y-4">
      <ContactPersonsSuppliersTable rows={rows} />
    </div>
  );
};

export default ContactPersonsSuppliersPage;
