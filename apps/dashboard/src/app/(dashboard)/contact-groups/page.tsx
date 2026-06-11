import { unstable_noStore as noStore } from "next/cache";
import { ContactGroupsClient } from "@/components/contact-groups/contact-groups-client";
import { PageHeading } from "@/components/layout/page-heading";
import { getContactGroupsList } from "./actions";

const ContactGroupsPage = async () => {
  noStore();

  const groups = await getContactGroupsList();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        titleKey="contact-groups-page.title"
        descriptionKey="contact-groups-page.description"
      />
      <ContactGroupsClient groups={groups} />
    </div>
  );
};

export default ContactGroupsPage;
