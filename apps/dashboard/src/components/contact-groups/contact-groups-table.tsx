import { getContactGroupsList } from "@/app/(dashboard)/contact-groups/actions";
import { ContactGroupsClient } from "@/components/contact-groups/contact-groups-client";
import { unstable_noStore as noStore } from "next/cache";

export const ContactGroupsTable = async () => {
  noStore();

  const groups = await getContactGroupsList();

  return <ContactGroupsClient groups={groups} />;
};
