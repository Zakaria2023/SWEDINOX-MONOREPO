import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import { returnOrderDetailToFormValues } from "@/app/(dashboard)/return-orders/mappers";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ReturnOrderForm } from "@/components/return-orders/return-order-form";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditReturnOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [returnOrder, companies, textCategories] = await Promise.all([
    getReturnOrderDetail(uuid),
    getCompaniesForSelect(),
    getTextCategoriesForSelect(),
  ]);

  if (!returnOrder) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href={`/return-orders/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Return order #{returnOrder.id}
        </Link>
      </div>
      <PageHeading
        title={`Edit return order #${returnOrder.id}`}
        description={returnOrder.companyName ?? undefined}
      />
      <ReturnOrderForm
        companies={companies}
        textCategories={textCategories}
        returnOrderUuid={uuid}
        defaultValues={returnOrderDetailToFormValues(returnOrder)}
      />
    </div>
  );
};

export default EditReturnOrderPage;
