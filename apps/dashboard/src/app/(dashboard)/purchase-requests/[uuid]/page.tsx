import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { PurchaseRequestDetailView } from "@/components/purchase-requests/purchase-request-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseRequestDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [request, companies] = await Promise.all([
    getPurchaseRequestDetail(uuid),
    getCompaniesForSelect(),
  ]);

  if (!request) {
    notFound();
  }

  const supplierOptions = companies.filter((company) =>
    company.roles?.includes("supplier"),
  );

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
      <PageHeading title={`Purchase request #${request.id}`} />
      <PurchaseRequestDetailView
        request={request}
        supplierOptions={supplierOptions}
      />
    </div>
  );
};

export default PurchaseRequestDetailPage;
