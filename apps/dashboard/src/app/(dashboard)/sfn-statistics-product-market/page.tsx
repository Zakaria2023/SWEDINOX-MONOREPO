import { getSfnStatistics } from "@/app/(dashboard)/sfn-statistics-product-market/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { SfnStatisticsTable } from "@/components/sfn-statistics-product-market/sfn-statistics-product-market-table-content";

const SfnStatisticsProductMarketPage = async () => {
  const rows = await getSfnStatistics();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="SFN statistics Product-Market combinations" />
      <SfnStatisticsTable rows={rows} />
    </div>
  );
};

export default SfnStatisticsProductMarketPage;
