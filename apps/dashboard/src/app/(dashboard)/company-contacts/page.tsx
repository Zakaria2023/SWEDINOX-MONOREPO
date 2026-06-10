import { CompanyContactsList } from "@/components/company-contacts/company-contacts-list";
import { unstable_noStore as noStore } from "next/cache";
import { getCompanyContacts } from "./actions";

const CompanyContactsPage = async () => {
  noStore();
  const contacts = await getCompanyContacts();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Contacts</h1>
      </div>

      <CompanyContactsList contacts={contacts} />
    </div>
  );
};

export default CompanyContactsPage;
