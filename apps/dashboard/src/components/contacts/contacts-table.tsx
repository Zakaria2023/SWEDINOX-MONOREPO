import { getContacts } from "@/app/(dashboard)/contacts/actions";
import { ContactsTableContent } from "@/components/contacts/contacts-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const ContactsTable = async () => {
  noStore();

  const contacts = await getContacts();

  return <ContactsTableContent contacts={contacts} />;
};
