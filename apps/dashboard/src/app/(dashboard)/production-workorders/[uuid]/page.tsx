import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductionWorkOrderDetail } from "@/app/(dashboard)/production-workorders/actions";
// The lots a run can be fed from are the same lots the warehouse picks from,
// so the lookup is reused rather than written twice.
import { getAvailableStockForSelect } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { ProductionWorkOrderDetailView } from "@/components/production-workorders/production-work-order-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductionWorkOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const workOrder = await getProductionWorkOrderDetail(uuid);

  if (!workOrder) {
    notFound();
  }

  // Sequential rather than concurrent: this database caps connections.
  const stockOptions = await getAvailableStockForSelect();
  const locations = await getLocationsForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/production-workorders"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Production Work Orders
        </Link>
      </div>
      <PageHeading title={`Work order ${workOrder.number}`} />
      <ProductionWorkOrderDetailView
        workOrder={workOrder}
        stockOptions={stockOptions}
        locations={locations}
      />
    </div>
  );
};

export default ProductionWorkOrderDetailPage;
