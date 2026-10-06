import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getLocationTreeForPicker,
  getSawOrdersForLot,
  getStockDetail,
  getStockLotDialog,
  getSupplierDeliveriesForLot,
} from "@/app/(dashboard)/stock/actions";
import { StockDetailView } from "@/components/stock/stock-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const StockDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // ⚠️ Sequential, not `Promise.all`. The shared MySQL instance caps
  // connections, and five fan-out queries per lot page is exactly the kind of
  // thing that exhausts the pool once two people have a lot open.
  const stock = await getStockDetail(uuid);

  if (!stock) {
    notFound();
  }

  const dialog = await getStockLotDialog(uuid);

  if (!dialog) {
    notFound();
  }

  const locations = await getLocationTreeForPicker();
  const deliveries = await getSupplierDeliveriesForLot(uuid);
  const sawOrders = await getSawOrdersForLot(uuid);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/stock"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Stock
        </Link>
      </div>
      <PageHeading
        title={[stock.productCode, stock.productName]
          .filter(Boolean)
          .join(" — ")}
      />
      <StockDetailView
        stock={stock}
        dialog={dialog}
        locations={locations}
        deliveries={deliveries}
        sawOrders={sawOrders}
      />
    </div>
  );
};

export default StockDetailPage;
