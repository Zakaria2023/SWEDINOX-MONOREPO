import { getCounterOrderForEdit } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { counterOrderToFormValues } from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderLogisticsEditor } from "@/components/counter-orders/edit/counter-order-logistics-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderLogisticsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const order = await getCounterOrderForEdit(uuid);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href={`/counter-orders/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title="Logistics" description="What the delivery needs from transport" />
      <CounterOrderLogisticsEditor
        counterOrderUuid={uuid}
        defaultValues={counterOrderToFormValues(order, order)}
      />
    </div>
  );
};

export default CounterOrderLogisticsPage;
