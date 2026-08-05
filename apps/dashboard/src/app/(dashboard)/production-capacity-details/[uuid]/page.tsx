import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductionCapacityDetail } from "@/app/(dashboard)/production-capacity-details/actions";
import { ProductionCapacityDetailView } from "@/components/production-capacity-details/production-capacity-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductionCapacityDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const detail = await getProductionCapacityDetail(uuid);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/production-capacity-details"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Production Capacity Details
        </Link>
      </div>
      <PageHeading
        title={
          detail.orderId === null
            ? `Detail #${detail.id}`
            : `Order #${detail.orderId} — line ${detail.lineNumber ?? "?"}`
        }
      />
      <ProductionCapacityDetailView detail={detail} />
    </div>
  );
};

export default ProductionCapacityDetailPage;
