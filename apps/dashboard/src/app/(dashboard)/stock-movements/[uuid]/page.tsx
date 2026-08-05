import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getStockMovementDetail } from "@/app/(dashboard)/stock-movements/actions";
import { StockMovementDetailView } from "@/components/stock-movements/stock-movement-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const StockMovementDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const movement = await getStockMovementDetail(uuid);

  if (!movement) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/stock-movements"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Stock Movements
        </Link>
      </div>
      <PageHeading title={`Movement #${movement.id}`} />
      <StockMovementDetailView movement={movement} />
    </div>
  );
};

export default StockMovementDetailPage;
