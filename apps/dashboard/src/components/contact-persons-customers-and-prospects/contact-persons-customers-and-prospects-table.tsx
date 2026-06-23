import { getContactPersonsCustomersAndProspects } from "@/app/(dashboard)/contact-persons-customers-and-prospects/actions";
import { ContactPersonsCustomersAndProspectsTableContent } from "./contact-persons-customers-and-prospects-table-content";

export const ContactPersonsCustomersAndProspectsTable = async () => {
  const rows = await getContactPersonsCustomersAndProspects();
  return <ContactPersonsCustomersAndProspectsTableContent rows={rows} />;
};
