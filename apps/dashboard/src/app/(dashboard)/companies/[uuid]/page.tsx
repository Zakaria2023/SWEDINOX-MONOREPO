import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompanyDetail } from "@/app/(dashboard)/companies/actions";
import { getInvoicesByCompanyUuid } from "@/app/(dashboard)/invoices/actions";
import { CompanyDetailView } from "@/components/companies/company-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const company = await getCompanyDetail(uuid);
  if (!company) notFound();

  const isCustomer = company.roles.includes("customer");
  const invoices = isCustomer ? await getInvoicesByCompanyUuid(uuid) : undefined;

  const roleLabels = company.roles.map((r) => COMPANY_ROLE_LABELS[r]).join(", ");

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Companies
        </Link>
      </div>
      <PageHeading
        title={company.companyName}
        description={roleLabels}
      />
      <CompanyDetailView company={company} invoices={invoices} />
    </div>
  );
};

export default CompanyDetailPage;
