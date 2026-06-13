import { getCompanyContacts } from "@/app/(dashboard)/company-contacts/actions";
import { CompanyContactsList } from "@/components/company-contacts/company-contacts-list";
import { unstable_noStore as noStore } from "next/cache";

export const CompanyContactsTable = async () => {
  noStore();

  const contacts = await getCompanyContacts();

  return <CompanyContactsList contacts={contacts} />;
};
