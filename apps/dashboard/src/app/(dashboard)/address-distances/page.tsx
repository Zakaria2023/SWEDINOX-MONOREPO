import {
  getAddressDistanceCountries,
  getAddressDistances,
} from "@/app/(dashboard)/address-distances/actions";
import { addressDistanceFilters } from "@/app/(dashboard)/address-distances/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { AddressDistancesTable } from "@/components/address-distances/address-distances-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const AddressDistancesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getAddressDistances(query);
  const countries = await getAddressDistanceCountries();
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <AddressDistancesTable
        page={page}
        filters={addressDistanceFilters(countries, companies)}
      />
    </div>
  );
};

export default AddressDistancesPage;
