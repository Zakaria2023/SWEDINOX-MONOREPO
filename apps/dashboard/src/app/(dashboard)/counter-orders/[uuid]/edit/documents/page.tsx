import { getCounterOrderForEdit } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { counterOrderToFormValues } from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderDocumentsEditor } from "@/components/counter-orders/edit/counter-order-documents-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderDocumentsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const order = await getCounterOrderForEdit(uuid);

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
      <PageHeading title="Documents" />
      <CounterOrderDocumentsEditor
        counterOrderUuid={uuid}
        defaultValues={counterOrderToFormValues(order, order)}
      />
    </div>
  );
};

export default CounterOrderDocumentsPage;
