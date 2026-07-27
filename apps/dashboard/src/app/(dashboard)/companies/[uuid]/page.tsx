import { getCompanyDetail } from "@/app/(dashboard)/companies/actions";
import { getInvoicesByCompanyUuid } from "@/app/(dashboard)/invoices/actions";
import { CompanyDetailView } from "@/components/companies/company-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";
import { ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const company = await getCompanyDetail(uuid);

  if (!company) {
    notFound();
  }

  const isCustomer = company.roles?.includes("customer");
  const invoices = isCustomer
    ? await getInvoicesByCompanyUuid(uuid)
    : undefined;

  const roleLabels = company.roles
    ?.map((r) => COMPANY_ROLE_LABELS[r])
    .join(", ");

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
      <div className="flex items-start justify-between gap-4">
        <PageHeading title={company.companyName} description={roleLabels} />
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent"
        >
          <Pencil className="size-4" />
          Edit
        </Link>
      </div>
      <CompanyDetailView company={company} invoices={invoices} />
    </div>
  );
};

export default CompanyDetailPage;
