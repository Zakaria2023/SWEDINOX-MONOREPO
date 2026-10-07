import {
  getContactPersonSupplierRegions,
  getContactPersonsSuppliers,
} from "@/app/(dashboard)/contact-persons-suppliers/actions";
import { contactPersonFilters } from "@/app/(dashboard)/contact-persons-customers-and-prospects/filters";
import { ContactPersonsSuppliersTable } from "@/components/contact-persons-suppliers/contact-persons-suppliers-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

// A supplier has no account manager, representative, customer group or
// classification, so only the contact's category and the region filter it.
const SUPPLIER_FILTER_KEYS = new Set(["category", "region"]);

const ContactPersonsSuppliersPage = async ({ searchParams }: Props) => {
  const page = await getContactPersonsSuppliers(
    parseTableQuery(await searchParams),
  );
  const regions = await getContactPersonSupplierRegions();

  return (
    <div className="space-y-4">
      <ContactPersonsSuppliersTable
        page={page}
        filters={contactPersonFilters(regions).filter((filter) =>
          SUPPLIER_FILTER_KEYS.has(filter.key),
        )}
      />
    </div>
  );
};

export default ContactPersonsSuppliersPage;
