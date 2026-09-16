import { getCharges } from "@/app/(dashboard)/charges/actions";
import { ChargesTable } from "@/components/charges/charges-table-content";
import { GenerateChargesButton } from "@/components/charges/generate-charges-button";

const ChargesPage = async () => {
  const charges = await getCharges();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <GenerateChargesButton />
      </div>
      <ChargesTable charges={charges} />
    </div>
  );
};

export default ChargesPage;
