import { getTransportByRegion } from "@/app/(dashboard)/transport-by-region/actions";
import { TransportByRegionTable } from "@/components/transport-by-region/transport-by-region-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TransportByRegionPage = async () => {
  const rows = await getTransportByRegion();

  return (
    <div className="space-y-4">
      <PageHeading title="Transport by Region" />
      <TransportByRegionTable rows={rows} />
    </div>
  );
};

export default TransportByRegionPage;
