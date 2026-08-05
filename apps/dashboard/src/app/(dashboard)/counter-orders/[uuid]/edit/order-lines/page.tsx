import { getCounterOrderForEdit } from "@/app/(dashboard)/counter-orders/[uuid]/edit/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { counterOrderToFormValues } from "@/app/(dashboard)/counter-orders/mappers";
import { CounterOrderLinesEditor } from "@/components/counter-orders/edit/counter-order-lines-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderLinesPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [order, products, productGroups] = await Promise.all([
    getCounterOrderForEdit(uuid),
    getProductsForSelect(),
    getProductGroupsForSelect(),
  ]);

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
      <PageHeading title="Order Lines" />
      <CounterOrderLinesEditor
        counterOrderUuid={uuid}
        defaultValues={counterOrderToFormValues(order, order)}
        products={products}
        productGroups={productGroups}
      />
    </div>
  );
};

export default CounterOrderLinesPage;
