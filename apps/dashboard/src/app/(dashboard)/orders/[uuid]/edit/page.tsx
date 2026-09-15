import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOrderDetail } from "@/app/(dashboard)/orders/actions";
import { OrderEditForm } from "@/components/orders/order-edit-form";
import { PageHeading } from "@/components/layout/page-heading";
import { WorkPanelLockNotice } from "@/components/open-work-panels/work-panel-lock-notice";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const order = await getOrderDetail(uuid);

  if (!order) {
    notFound();
  }

  if (order.status === "cancelled") {
    redirect(`/orders/${uuid}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/orders/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Order #{order.id}
        </Link>
      </div>
      <PageHeading title={`Edit Order #${order.id}`} />
      <WorkPanelLockNotice
        panelType="order"
        recordUuid={uuid}
        description={`Order ${order.id}, ${order.companyName ?? "no customer"}`}
      />
      <OrderEditForm order={order} />
    </div>
  );
};

export default EditOrderPage;
