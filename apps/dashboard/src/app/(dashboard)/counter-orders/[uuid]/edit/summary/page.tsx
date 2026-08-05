import { getCounterOrderForEdit } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { counterOrderToFormValues } from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderSummaryEditor } from "@/components/counter-orders/edit/counter-order-summary-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderSummaryPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const order = await getCounterOrderForEdit(uuid);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link
          href={`/counter-orders/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title="Summary" />
      <CounterOrderSummaryEditor
        counterOrderUuid={uuid}
        defaultValues={counterOrderToFormValues(order, order)}
      />
    </div>
  );
};

export default CounterOrderSummaryPage;
