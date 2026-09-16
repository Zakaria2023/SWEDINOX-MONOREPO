import { getFreightMovements } from "@/app/(dashboard)/freight-movements/actions";
import { FreightMovementsTable } from "@/components/freight-movements/freight-movements-table-content";

const FreightMovementsPage = async () => {
  const freightMovements = await getFreightMovements();

  return (
    <div className="space-y-4">
      <FreightMovementsTable freightMovements={freightMovements} />
    </div>
  );
};

export default FreightMovementsPage;
