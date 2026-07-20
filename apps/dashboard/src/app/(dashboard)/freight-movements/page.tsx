import { getFreightMovements } from "@/app/(dashboard)/freight-movements/actions";
import { FreightMovementsTable } from "@/components/freight-movements/freight-movements-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const FreightMovementsPage = async () => {
  const freightMovements = await getFreightMovements();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Freight Movement"
        description="The goods-flow ledger — every mutation with its running stock balance and accounting dimensions"
      />
      <FreightMovementsTable freightMovements={freightMovements} />
    </div>
  );
};

export default FreightMovementsPage;
