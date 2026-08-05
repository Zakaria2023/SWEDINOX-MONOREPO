import { getPickStatistics } from "@/app/(dashboard)/pick-statistics/actions";
import { PickStatisticsTable } from "@/components/pick-statistics/pick-statistics-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PickStatisticsPage = async () => {
  const statistics = await getPickStatistics();

  return (
    <div className="space-y-4">
      <PageHeading title="Pick Statistic" />
      <PickStatisticsTable statistics={statistics} />
    </div>
  );
};

export default PickStatisticsPage;
