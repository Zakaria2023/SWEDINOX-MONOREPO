import { getCompanyDetail } from "@/app/(dashboard)/companies/actions";
import { getInvoicesByCompanyUuid } from "@/app/(dashboard)/invoices/actions";
import { CompanyDetailView } from "@/components/companies/company-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { getClerkUserNames } from "@/lib/server/clerk";
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
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
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
        <PageHeading title={company.companyName} />
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent"
        >
          <Pencil className="size-4" />
          Edit
        </Link>
      </div>
      {/* The company toolbar's related overviews: `Purchase lines ·
          Warehouse workorders · Orders and Quotes · Production workorders ·
          Transport workorders`, each narrowed to this company. */}
      <RelatedRecordsBar
        records={[
          {
            label: "Purchase lines",
            href: company.roles?.includes("supplier")
              ? `/purchase-lines?supplier=${uuid}`
              : null,
          },
          {
            label: "Warehouse workorders",
            href: `/warehouse-work-order-lines?company=${uuid}`,
          },
          {
            label: "Orders and Quotes",
            href: `/orders-and-quotes?company=${uuid}`,
          },
          {
            label: "Production workorders",
            href: `/production-work-order-lines?company=${uuid}`,
          },
          {
            label: "Transport workorders",
            href: `/transport-workorders?company=${uuid}`,
          },
        ]}
      />
      <CompanyDetailView
        company={company}
        invoices={invoices}
        userNames={userNames}
      />
    </div>
  );
};

export default CompanyDetailPage;
