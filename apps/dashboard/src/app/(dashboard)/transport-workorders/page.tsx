import { getTransportWorkOrderLines } from "@/app/(dashboard)/transport-workorders/actions";
import { TransportWorkOrdersTable } from "@/components/transport-workorders/transport-workorders-table-content";

const TransportWorkOrdersPage = async () => {
  const lines = await getTransportWorkOrderLines();

  return <TransportWorkOrdersTable lines={lines} />;
};

export default TransportWorkOrdersPage;
