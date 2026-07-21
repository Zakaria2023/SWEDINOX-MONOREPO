import { getReoptimize } from "@/app/(dashboard)/reoptimize/actions";
import { ReoptimizeTable } from "@/components/reoptimize/reoptimize-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ReoptimizePage = async () => {
  const rows = await getReoptimize();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="(Re)optimize"
        description="Re-optimization view of the sawing/nesting plan per order line — dimensions, the sawing plan and geometry, the delivery plan and the material fetched from stock"
      />
      <ReoptimizeTable rows={rows} />
    </div>
  );
};

export default ReoptimizePage;
