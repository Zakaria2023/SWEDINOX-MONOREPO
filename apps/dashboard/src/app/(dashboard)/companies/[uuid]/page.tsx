import {
  getCompanyDetail,
  getCompanyRelatedRecords,
} from "@/app/(dashboard)/companies/actions";
import { CompanyActivateButton } from "@/components/companies/company-activate-button";
import { CompanyDetailView } from "@/components/companies/company-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/shadcn/button";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { getClerkUserNames } from "@/lib/server/clerk";
import { ChevronLeft, FileText, Pencil } from "lucide-react";
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

  const userNames = await getClerkUserNames();
  const related = await getCompanyRelatedRecords(uuid);

  // The reference's window title: name, street, CITY, phone — taken from the
  // visiting address, else the first one on file.
  const mainAddress =
    company.addresses.find((address) => address.category.includes("visit")) ??
    company.addresses[0];
  const title = [
    company.companyName,
    mainAddress?.streetAndNo,
    mainAddress?.city?.toUpperCase(),
    mainAddress?.telephone,
  ]
    .filter(Boolean)
    .join(", ");

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
        <PageHeading title={title} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="Not built yet: there is no Word template for a company."
          >
            <FileText className="me-1.5 size-4" />
            Show Word File
          </Button>
          <CompanyActivateButton
            companyUuid={uuid}
            isInactive={company.isInactive ?? false}
          />
          <Link
            href={`/companies/${uuid}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent"
          >
            <Pencil className="size-4" />
            Edit
          </Link>
        </div>
      </div>
      {/* The company toolbar's related overviews: `Order lines · Orders and
          Quotes · Stock on location`, then `Purchase lines · Warehouse
          workorders · Production workorders · Transport workorders`, each
          narrowed to this company. */}
      <RelatedRecordsBar
        records={[
          {
            label: "Order lines",
            href: `/order-lines?company=${uuid}`,
          },
          {
            label: "Orders and Quotes",
            href: `/orders-and-quotes?company=${uuid}`,
          },
          {
            label: "Stock on location",
            href: `/stock-on-location?owner=${uuid}`,
          },
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
        related={related}
        userNames={userNames}
      />
    </div>
  );
};

export default CompanyDetailPage;
