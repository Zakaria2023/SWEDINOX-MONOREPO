import { unstable_noStore as noStore } from "next/cache";
import { getContactGroupsList } from "./actions";
import { ContactGroupsClient } from "@/components/contact-groups/contact-groups-client";

const ContactGroupsPage = async () => {
  noStore();
  const groups = await getContactGroupsList();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Groups</h1>
        <p className="mt-2 text-gray-600">
          Manage groups that can be assigned to contacts.
        </p>
      </div>

      <ContactGroupsClient groups={groups} />
    </div>
  );
};

export default ContactGroupsPage;
