import { getSawingWaste } from "@/app/(dashboard)/control-sawing-waste/actions";
import { ControlSawingWasteTable } from "@/components/control-sawing-waste/control-sawing-waste-table-content";

const ControlSawingWastePage = async () => {
  const rows = await getSawingWaste();

  return (
    <div className="space-y-4">
      <ControlSawingWasteTable rows={rows} />
    </div>
  );
};

export default ControlSawingWastePage;
