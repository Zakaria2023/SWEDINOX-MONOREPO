import { getContactPersonsCustomersAndProspects } from "@/app/(dashboard)/contact-persons-customers-and-prospects/actions";
import { ContactPersonsCustomersAndProspectsTable } from "@/components/contact-persons-customers-and-prospects/contact-persons-customers-and-prospects-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ContactPersonsCustomersAndProspectsPage = async () => {
  const rows = await getContactPersonsCustomersAndProspects();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Contact Persons Customers and Prospects"
        description="Overview of all contact persons linked to customers and prospects"
      />
      <ContactPersonsCustomersAndProspectsTable rows={rows} />
    </div>
  );
};

export default ContactPersonsCustomersAndProspectsPage;
