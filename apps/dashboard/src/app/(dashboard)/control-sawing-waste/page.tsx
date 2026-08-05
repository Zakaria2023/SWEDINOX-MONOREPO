import { getSawingWaste } from "@/app/(dashboard)/control-sawing-waste/actions";
import { ControlSawingWasteTable } from "@/components/control-sawing-waste/control-sawing-waste-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ControlSawingWastePage = async () => {
  const rows = await getSawingWaste();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Control: Sawing Waste" />
      <ControlSawingWasteTable rows={rows} />
    </div>
  );
};

export default ControlSawingWastePage;
