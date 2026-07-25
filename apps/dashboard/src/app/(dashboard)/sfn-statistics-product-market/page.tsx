import { getSfnStatistics } from "@/app/(dashboard)/sfn-statistics-product-market/actions";
import { SfnStatisticsProductMarketTable } from "@/components/sfn-statistics-product-market/sfn-statistics-product-market-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SfnStatisticsProductMarketPage = async () => {
  const rows = await getSfnStatistics();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="SFN Statistics Product-Market Combinations"
        description="Invoiced goods grouped by product-market combination (CBS commodity number and SBI code) per period"
      />
      <SfnStatisticsProductMarketTable rows={rows} />
    </div>
  );
};

export default SfnStatisticsProductMarketPage;
