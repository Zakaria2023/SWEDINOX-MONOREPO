import { getContactPersonsCustomersAndProspects } from "@/app/(dashboard)/contact-persons-customers-and-prospects/actions";
import { ContactPersonsCustomersAndProspectsTable } from "@/components/contact-persons-customers-and-prospects/contact-persons-customers-and-prospects-table-content";

const ContactPersonsCustomersAndProspectsPage = async () => {
  const rows = await getContactPersonsCustomersAndProspects();

  return (
    <div className="space-y-4">
      <ContactPersonsCustomersAndProspectsTable rows={rows} />
    </div>
  );
};

export default ContactPersonsCustomersAndProspectsPage;
