import { getCharges } from "@/app/(dashboard)/charges/actions";
import { ChargesTable } from "@/components/charges/charges-table-content";
import { GenerateChargesButton } from "@/components/charges/generate-charges-button";
import { PageHeading } from "@/components/layout/page-heading";

const ChargesPage = async () => {
  const charges = await getCharges();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Charges" />
        <GenerateChargesButton />
      </div>
      <ChargesTable charges={charges} />
    </div>
  );
};

export default ChargesPage;
