import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyPurchaseOrdersEditor } from "@/components/companies/edit/company-purchase-orders-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPurchaseOrdersForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyPurchaseOrdersPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, purchaseOrders] = await Promise.all([
    getCompanyHeader(uuid),
    getPurchaseOrdersForCompany(uuid),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Purchase Orders — ${company.companyName}`} />
      <CompanyPurchaseOrdersEditor
        companyUuid={uuid}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
};

export default CompanyPurchaseOrdersPage;
