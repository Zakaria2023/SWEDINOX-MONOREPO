import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getWarehouseCapacityDetail } from "@/app/(dashboard)/warehouse-capacity/actions";
import { WarehouseCapacityDetailView } from "@/components/warehouse-capacity/warehouse-capacity-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatDateColumn } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const WarehouseCapacityDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const capacity = await getWarehouseCapacityDetail(uuid);

  if (!capacity) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/warehouse-capacity"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Warehouse Capacity
        </Link>
      </div>
      <PageHeading title={formatDateColumn(capacity.capacityDate)} />
      <WarehouseCapacityDetailView capacity={capacity} />
    </div>
  );
};

export default WarehouseCapacityDetailPage;
