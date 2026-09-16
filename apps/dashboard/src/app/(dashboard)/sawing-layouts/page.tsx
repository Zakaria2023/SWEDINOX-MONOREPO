import { getSawingLayouts } from "@/app/(dashboard)/sawing-layouts/actions";
import { SawingLayoutsTable } from "@/components/sawing-layouts/sawing-layouts-table-content";

const SawingLayoutsPage = async () => {
  const layouts = await getSawingLayouts();

  return (
    <div className="space-y-4">
      <SawingLayoutsTable layouts={layouts} />
    </div>
  );
};

export default SawingLayoutsPage;
