import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTransportWorkOrderLineDetail } from "@/app/(dashboard)/transport-workorders/actions";
import { TransportWorkOrderLineDetailView } from "@/components/transport-workorders/transport-work-order-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TransportWorkOrderLinePage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getTransportWorkOrderLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/transport-workorders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Transport Workorders
        </Link>
      </div>
      <PageHeading
        title={
          [line.productCode ?? line.catalogProductCode, line.productName]
            .filter(Boolean)
            .join(" — ") || `Line #${line.id}`
        }
        description={
          line.tripNumber === null ? undefined : `Trip ${line.tripNumber}`
        }
      />
      <TransportWorkOrderLineDetailView line={line} />
    </div>
  );
};

export default TransportWorkOrderLinePage;
