import { getFreightMovements } from "@/app/(dashboard)/freight-movements/actions";
import { FreightMovementsTable } from "@/components/freight-movements/freight-movements-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const FreightMovementsPage = async () => {
  const freightMovements = await getFreightMovements();

  return (
    <div className="space-y-4">
      <PageHeading title="Freight Movement" />
      <FreightMovementsTable freightMovements={freightMovements} />
    </div>
  );
};

export default FreightMovementsPage;
