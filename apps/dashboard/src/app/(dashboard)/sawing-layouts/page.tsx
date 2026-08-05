import { getSawingLayouts } from "@/app/(dashboard)/sawing-layouts/actions";
import { SawingLayoutsTable } from "@/components/sawing-layouts/sawing-layouts-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SawingLayoutsPage = async () => {
  const layouts = await getSawingLayouts();

  return (
    <div className="space-y-4">
      <PageHeading title="Sawing Layouts" />
      <SawingLayoutsTable layouts={layouts} />
    </div>
  );
};

export default SawingLayoutsPage;
