import { getReoptimize } from "@/app/(dashboard)/reoptimize/actions";
import { ReoptimizeTable } from "@/components/reoptimize/reoptimize-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ReoptimizePage = async () => {
  const rows = await getReoptimize();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="(Re)optimize" />
      <ReoptimizeTable rows={rows} />
    </div>
  );
};

export default ReoptimizePage;
