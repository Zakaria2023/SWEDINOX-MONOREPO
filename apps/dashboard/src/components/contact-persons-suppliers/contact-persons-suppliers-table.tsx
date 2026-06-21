import { getContactPersonsSuppliers } from "@/app/(dashboard)/contact-persons-suppliers/actions";
import { ContactPersonsSuppliersTableContent } from "./contact-persons-suppliers-table-content";

export const ContactPersonsSuppliersTable = async () => {
  const rows = await getContactPersonsSuppliers();
  return <ContactPersonsSuppliersTableContent rows={rows} />;
};
