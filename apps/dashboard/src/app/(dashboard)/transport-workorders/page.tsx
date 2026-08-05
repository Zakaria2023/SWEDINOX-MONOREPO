import { getTransportWorkOrderLines } from "@/app/(dashboard)/transport-workorders/actions";
import { TransportWorkOrdersTable } from "@/components/transport-workorders/transport-workorders-table-content";
import { GenerateTransportButton } from "@/components/transport-workorders/generate-transport-button";
import { PageHeading } from "@/components/layout/page-heading";

const TransportWorkOrdersPage = async () => {
  const lines = await getTransportWorkOrderLines();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Transport workorders" />
        <GenerateTransportButton />
      </div>
      <TransportWorkOrdersTable lines={lines} />
    </div>
  );
};

export default TransportWorkOrdersPage;
