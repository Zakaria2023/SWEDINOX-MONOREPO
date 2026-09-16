import { getCounterOrderForEdit } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { counterOrderToFormValues } from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderHeaderEditor } from "@/components/counter-orders/edit/counter-order-header-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderHeaderPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [order, companies] = await Promise.all([
    getCounterOrderForEdit(uuid),
    getCompaniesForSelect(),
  ]);

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
      <CounterOrderHeaderEditor
        counterOrderUuid={uuid}
        defaultValues={counterOrderToFormValues(order, order)}
        companies={companies}
      />
    </div>
  );
};

export default CounterOrderHeaderPage;
