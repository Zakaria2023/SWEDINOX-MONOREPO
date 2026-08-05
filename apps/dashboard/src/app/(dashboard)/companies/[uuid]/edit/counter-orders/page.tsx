import { CompanyCounterOrdersEditor } from "@/components/companies/edit/company-counter-orders-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyHeader } from "../contacts/actions";
import { getCounterOrdersForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyCounterOrdersPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, counterOrders] = await Promise.all([
    getCompanyHeader(uuid),
    getCounterOrdersForCompany(uuid),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Counter Orders — ${company.companyName}`} />
      <CompanyCounterOrdersEditor
        companyUuid={uuid}
        counterOrders={counterOrders}
      />
    </div>
  );
};

export default CompanyCounterOrdersPage;
