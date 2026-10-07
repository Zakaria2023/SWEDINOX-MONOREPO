import { getTransportWorkOrderLines } from "@/app/(dashboard)/transport-workorders/actions";
import { TransportWorkOrdersTable } from "@/components/transport-workorders/transport-workorders-table-content";
import { SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const TransportWorkOrdersPage = async ({ searchParams }: Props) => {
  const { company } = await searchParams;
  const lines = await getTransportWorkOrderLines(
    typeof company === "string" ? company : undefined,
  );

  return <TransportWorkOrdersTable lines={lines} />;
};

export default TransportWorkOrdersPage;
