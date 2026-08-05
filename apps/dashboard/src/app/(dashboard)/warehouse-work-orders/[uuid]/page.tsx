import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getWarehouseWorkOrderDetail } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { WarehouseWorkOrderDetailView } from "@/components/warehouse-work-orders/warehouse-work-order-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const WarehouseWorkOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const workOrder = await getWarehouseWorkOrderDetail(uuid);

  if (!workOrder) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/warehouse-work-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Warehouse Work Orders
        </Link>
      </div>
      <PageHeading title={`Work order #${workOrder.id}`} />
      <WarehouseWorkOrderDetailView workOrder={workOrder} />
    </div>
  );
};

export default WarehouseWorkOrderDetailPage;
