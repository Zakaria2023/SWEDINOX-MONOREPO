import { unstable_noStore as noStore } from "next/cache";
import { CompanyContactsList } from "@/components/company-contacts/company-contacts-list";
import { PageHeading } from "@/components/layout/page-heading";
import { getCompanyContacts } from "./actions";

const CompanyContactsPage = async () => {
  noStore();

  const contacts = await getCompanyContacts();

  return (
    <div className="space-y-6 p-6">
      <PageHeading titleKey="company-contacts-page.title" />
      <CompanyContactsList contacts={contacts} />
    </div>
  );
};

export default CompanyContactsPage;
