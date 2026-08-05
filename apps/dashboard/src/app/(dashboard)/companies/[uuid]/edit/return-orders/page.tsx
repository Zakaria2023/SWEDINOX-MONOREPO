import { CompanyReturnOrdersEditor } from "@/components/companies/edit/company-return-orders-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyHeader } from "../contacts/actions";
import { getReturnOrdersForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyReturnOrdersPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, returnOrders] = await Promise.all([
    getCompanyHeader(uuid),
    getReturnOrdersForCompany(uuid),
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
      <PageHeading title={`Return Orders — ${company.companyName}`} />
      <CompanyReturnOrdersEditor
        companyUuid={uuid}
        returnOrders={returnOrders}
      />
    </div>
  );
};

export default CompanyReturnOrdersPage;
