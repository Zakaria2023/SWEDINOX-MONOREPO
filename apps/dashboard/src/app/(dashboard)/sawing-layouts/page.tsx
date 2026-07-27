import { getSawingLayouts } from "@/app/(dashboard)/sawing-layouts/actions";
import { SawingLayoutsTable } from "@/components/sawing-layouts/sawing-layouts-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SawingLayoutsPage = async () => {
  const layouts = await getSawingLayouts();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Sawing Layouts"
        description="Cutting plans per saw — the raw length fetched from stock, the sawing operation and the piece slots it produces"
      />
      <SawingLayoutsTable layouts={layouts} />
    </div>
  );
};

export default SawingLayoutsPage;
