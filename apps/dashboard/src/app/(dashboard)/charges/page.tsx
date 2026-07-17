import { getCharges } from "@/app/(dashboard)/charges/actions";
import { ChargesTable } from "@/components/charges/charges-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ChargesPage = async () => {
  const charges = await getCharges();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Charges"
        description="Sales surcharges billed on top of the order lines"
      />
      <ChargesTable charges={charges} />
    </div>
  );
};

export default ChargesPage;
