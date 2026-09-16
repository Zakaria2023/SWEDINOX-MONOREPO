import { getReoptimize } from "@/app/(dashboard)/reoptimize/actions";
import { ReoptimizeTable } from "@/components/reoptimize/reoptimize-table-content";

const ReoptimizePage = async () => {
  const rows = await getReoptimize();

  return (
    <div className="space-y-4">
      <ReoptimizeTable rows={rows} />
    </div>
  );
};

export default ReoptimizePage;
