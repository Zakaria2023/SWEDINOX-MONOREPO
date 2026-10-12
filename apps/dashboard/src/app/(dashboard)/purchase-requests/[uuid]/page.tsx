import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { purchaseRequestToFormValues } from "@/app/(dashboard)/purchase-requests/mappers";
import { PurchaseRequestScreen } from "@/components/purchase-requests/purchase-request-screen";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * One screen, as the reference has it: a saved request is the form it was
 * typed on — the toolbar, the header, then the lines, its quotes and every
 * panel.
 */
const PurchaseRequestDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const request = await getPurchaseRequestDetail(uuid);

  if (!request) {
    notFound();
  }

  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();

  // Saving, making final or asking suppliers changes what the form was opened
  // with, so it is opened afresh rather than holding the old values.
  const version = [
    request.status,
    request.updatedAt.getTime(),
    ...request.items.map((item) => item.uuid),
  ].join("|");

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-requests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase requests
        </Link>
      </div>
      <PurchaseRequestScreen
        version={version}
        companies={companies}
        clerkUsers={clerkUsers}
        request={request}
        defaultValues={purchaseRequestToFormValues(request)}
      />
    </div>
  );
};

export default PurchaseRequestDetailPage;
