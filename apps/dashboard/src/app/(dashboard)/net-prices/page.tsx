import { getNetPrices } from "@/app/(dashboard)/net-prices/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { GenerateNetPricesButton } from "@/components/net-prices/generate-net-prices-button";
import { NetPricesTable } from "@/components/net-prices/net-prices-table-content";

const NetPricesPage = async () => {
  const rows = await getNetPrices();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Net prices" />
        <GenerateNetPricesButton />
      </div>
      <NetPricesTable rows={rows} />
    </div>
  );
};

export default NetPricesPage;
