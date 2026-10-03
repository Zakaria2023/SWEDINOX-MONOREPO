import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { purchaseRequestToFormValues } from "@/app/(dashboard)/purchase-requests/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { PurchaseRequestForm } from "@/components/purchase-requests/purchase-request-form";
import {
  canEditPurchaseRequestLines,
  isPurchaseRequestEditable,
} from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditPurchaseRequestPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [request, companies, clerkUsers] = await Promise.all([
    getPurchaseRequestDetail(uuid),
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  if (!request) {
    notFound();
  }


  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/purchase-requests/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to purchase request
        </Link>
      </div>
      <PageHeading title={`Edit Purchase Request #${request.id}`} />

      {isPurchaseRequestEditable(request.status) ? (
        <PurchaseRequestForm
          companies={companies}
          clerkUsers={clerkUsers}
          purchaseRequestUuid={uuid}
          defaultValues={purchaseRequestToFormValues(request)}
          canEditLines={canEditPurchaseRequestLines(request.status)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {request.status === "cancelled"
            ? "This request is cancelled."
            : "This request has already been awarded — a purchase order was raised from it."}
        </div>
      )}
    </div>
  );
};

export default EditPurchaseRequestPage;
