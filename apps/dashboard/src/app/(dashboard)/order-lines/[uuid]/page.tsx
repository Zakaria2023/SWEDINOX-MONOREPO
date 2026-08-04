import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOrderLineDetail } from "@/app/(dashboard)/order-lines/actions";
import { OrderLineDetailView } from "@/components/order-lines/order-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const OrderLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getOrderLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/order-lines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Order Lines
        </Link>
      </div>
      <PageHeading
        title={
          line.orderId === null
            ? `Line #${line.id}`
            : `Order #${line.orderId} — line ${line.lineNumber ?? "?"}`
        }
        description={
          [line.productCode, line.productName].filter(Boolean).join(" — ") ||
          undefined
        }
      />
      <OrderLineDetailView line={line} />
    </div>
  );
};

export default OrderLineDetailPage;
