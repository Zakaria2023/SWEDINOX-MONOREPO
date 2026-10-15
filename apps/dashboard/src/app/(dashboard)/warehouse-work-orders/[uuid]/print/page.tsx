import { notFound } from "next/navigation";
import { getWarehouseWorkOrderDetail } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { AutoPrint } from "@/components/warehouse-work-orders/auto-print";
import { WorkOrderSlip } from "@/components/warehouse-work-orders/work-order-slip";

type Props = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ labels?: string }>;
};

/**
 * What `Vrijgeven` prints: the slip, and the stock labels unless the order
 * was released without them. Opened by the release itself, with the print
 * dialog already up.
 */
const WarehouseWorkOrderPrintPage = async ({ params, searchParams }: Props) => {
  const { uuid } = await params;
  const { labels } = await searchParams;

  const workOrder = await getWarehouseWorkOrderDetail(uuid);
  if (!workOrder) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <AutoPrint />
      <WorkOrderSlip workOrder={workOrder} withStockLabels={labels === "1"} />
    </div>
  );
};

export default WarehouseWorkOrderPrintPage;
