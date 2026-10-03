import {
  getCharges,
  getChargeSurcharges,
} from "@/app/(dashboard)/charges/actions";
import { chargeFilters } from "@/app/(dashboard)/charges/filters";
import { ChargesTable } from "@/components/charges/charges-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ChargesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCharges(query);
  const surcharges = await getChargeSurcharges();

  return <ChargesTable page={page} filters={chargeFilters(surcharges)} />;
};

export default ChargesPage;
