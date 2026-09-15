import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOrderLineDetail } from "@/app/(dashboard)/order-lines/actions";
import { OrderLineBlockControl } from "@/components/order-lines/order-line-block-control";
import { OrderLineDetailView } from "@/components/order-lines/order-line-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const OrderLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getOrderLineDetail(uuid);

  if (!line) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
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
      />
      <OrderLineBlockControl
        orderItemUuid={line.uuid}
        orderUuid={line.orderUuid}
        status={line.status}
        commercialBlock={line.commercialBlock}
      />
      <OrderLineDetailView line={line}  userNames={userNames} />
    </div>
  );
};

export default OrderLineDetailPage;
