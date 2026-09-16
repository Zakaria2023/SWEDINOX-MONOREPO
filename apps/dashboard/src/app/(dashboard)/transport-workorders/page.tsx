import { getTransportWorkOrderLines } from "@/app/(dashboard)/transport-workorders/actions";
import { TransportWorkOrdersTable } from "@/components/transport-workorders/transport-workorders-table-content";
import { GenerateTransportButton } from "@/components/transport-workorders/generate-transport-button";

const TransportWorkOrdersPage = async () => {
  const lines = await getTransportWorkOrderLines();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <GenerateTransportButton />
      </div>
      <TransportWorkOrdersTable lines={lines} />
    </div>
  );
};

export default TransportWorkOrdersPage;
