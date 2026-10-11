import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { ReturnOrderForm } from "@/components/return-orders/return-order-form";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * One screen, as the reference has it: a saved return is the form it was
 * typed on — the toolbar, the header, then the lines and every panel.
 */
const ReturnOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const returnOrder = await getReturnOrderDetail(uuid);

  if (!returnOrder) {
    notFound();
  }

  const companies = await getCompaniesForSelect();
  const textCategories = await getTextCategoriesForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/return-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Return orders
        </Link>
      </div>
      <ReturnOrderForm
        companies={companies}
        textCategories={textCategories}
        existing={returnOrder}
      />
    </div>
  );
};

export default ReturnOrderDetailPage;
