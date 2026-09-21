import {
  getCharges,
  getChargeSurcharges,
} from "@/app/(dashboard)/charges/actions";
import { chargeFilters } from "@/app/(dashboard)/charges/filters";
import { ChargesTable } from "@/components/charges/charges-table-content";
import { GenerateChargesButton } from "@/components/charges/generate-charges-button";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ChargesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCharges(query);
  const surcharges = await getChargeSurcharges();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <GenerateChargesButton />
      </div>
      <ChargesTable page={page} filters={chargeFilters(surcharges)} />
    </div>
  );
};

export default ChargesPage;
