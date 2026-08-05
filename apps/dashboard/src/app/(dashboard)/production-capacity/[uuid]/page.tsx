import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductionCapacityDetail } from "@/app/(dashboard)/production-capacity/actions";
import { ProductionCapacityDetailView } from "@/components/production-capacity/production-capacity-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatDateColumn } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductionCapacityDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const capacity = await getProductionCapacityDetail(uuid);

  if (!capacity) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/production-capacity"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Production Capacity
        </Link>
      </div>
      <PageHeading
        title={
          [capacity.machineCode, capacity.machineName]
            .filter(Boolean)
            .join(" — ") || "Production capacity"
        }
        description={formatDateColumn(capacity.capacityDate)}
      />
      <ProductionCapacityDetailView capacity={capacity} />
    </div>
  );
};

export default ProductionCapacityDetailPage;
