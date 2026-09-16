import { getAddresses } from "@/app/(dashboard)/addresses/actions";
import { addressFilters } from "@/app/(dashboard)/addresses/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { AddressesTable } from "@/components/addresses/addresses-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const AddressesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections, and the
  // page is already two queries before the company list is added.
  const addresses = await getAddresses(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <AddressesTable page={addresses} filters={addressFilters(companies)} />
    </div>
  );
};

export default AddressesPage;
