import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTransportStatusAdjustmentDetail } from "@/app/(dashboard)/transport-status-adjustments/actions";
import { TransportStatusAdjustmentDetailView } from "@/components/transport-status-adjustments/transport-status-adjustment-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { TRIP_STATUS_LABELS } from "@/lib/labels";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TransportStatusAdjustmentDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const adjustment = await getTransportStatusAdjustmentDetail(uuid);

  if (!adjustment) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/transport-status-adjustments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Transport Status Adjustments
        </Link>
      </div>
      <PageHeading
        title={
          adjustment.tripStatus
            ? TRIP_STATUS_LABELS[adjustment.tripStatus]
            : `Adjustment #${adjustment.id}`
        }
      />
      <TransportStatusAdjustmentDetailView adjustment={adjustment} />
    </div>
  );
};

export default TransportStatusAdjustmentDetailPage;
