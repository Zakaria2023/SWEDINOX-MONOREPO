import {
  getContactPersonCustomerRegions,
  getContactPersonsCustomersAndProspects,
} from "@/app/(dashboard)/contact-persons-customers-and-prospects/actions";
import { contactPersonFilters } from "@/app/(dashboard)/contact-persons-customers-and-prospects/filters";
import { ContactPersonsCustomersAndProspectsTable } from "@/components/contact-persons-customers-and-prospects/contact-persons-customers-and-prospects-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ContactPersonsCustomersAndProspectsPage = async ({
  searchParams,
}: Props) => {
  const params = await searchParams;
  const page = await getContactPersonsCustomersAndProspects(
    parseTableQuery(params),
  );
  const regions = await getContactPersonCustomerRegions();

  return (
    <div className="space-y-4">
      <ContactPersonsCustomersAndProspectsTable
        page={page}
        filters={contactPersonFilters(regions)}
      />
    </div>
  );
};

export default ContactPersonsCustomersAndProspectsPage;
