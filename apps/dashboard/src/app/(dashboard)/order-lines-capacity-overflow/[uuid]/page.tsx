import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCapacityOverflowDetail } from "@/app/(dashboard)/order-lines-capacity-overflow/actions";
import { CapacityOverflowDetailView } from "@/components/order-lines-capacity-overflow/capacity-overflow-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CapacityOverflowDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const overflow = await getCapacityOverflowDetail(uuid);

  if (!overflow) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/order-lines-capacity-overflow"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Order Lines Capacity Overflow
        </Link>
      </div>
      <PageHeading
        title={
          overflow.orderId === null
            ? `Overflow #${overflow.id}`
            : `Order #${overflow.orderId} — line ${overflow.lineNumber ?? "?"}`
        }
        description={overflow.capacityName ?? undefined}
      />
      <CapacityOverflowDetailView overflow={overflow} />
    </div>
  );
};

export default CapacityOverflowDetailPage;
