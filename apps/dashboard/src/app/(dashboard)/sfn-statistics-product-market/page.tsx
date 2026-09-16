import { getSfnStatistics } from "@/app/(dashboard)/sfn-statistics-product-market/actions";
import { SfnStatisticsTable } from "@/components/sfn-statistics-product-market/sfn-statistics-product-market-table-content";

const SfnStatisticsProductMarketPage = async () => {
  const rows = await getSfnStatistics();

  return (
    <div className="space-y-4">
      <SfnStatisticsTable rows={rows} />
    </div>
  );
};

export default SfnStatisticsProductMarketPage;
