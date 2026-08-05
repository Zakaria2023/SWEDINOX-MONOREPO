import { getCounterOrderForEdit } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { getAddressesByCompanyUuid } from "@/app/(dashboard)/counter-orders/actions";
import { counterOrderToFormValues } from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderDeliveryEditor } from "@/components/counter-orders/edit/counter-order-delivery-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderDeliveryPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const order = await getCounterOrderForEdit(uuid);
  const addresses = order
    ? await getAddressesByCompanyUuid(order.companyUuid)
    : [];

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/counter-orders/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title="Delivery" />
      <CounterOrderDeliveryEditor
        counterOrderUuid={uuid}
        defaultValues={counterOrderToFormValues(order, order)}
        addresses={addresses}
      />
    </div>
  );
};

export default CounterOrderDeliveryPage;
