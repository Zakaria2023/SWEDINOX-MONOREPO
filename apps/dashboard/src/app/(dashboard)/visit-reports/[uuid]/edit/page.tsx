import { EditSectionCard } from "@/components/companies/edit/edit-section-card";
import { PageHeading } from "@/components/layout/page-heading";
import {
  COMPANY_CLASSIFICATION_LABELS,
  VISIT_REPORT_CATEGORY_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisitReportEditOverview } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

type SectionCardData = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

const VisitReportEditPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const overview = await getVisitReportEditOverview(uuid);

  if (!overview) {
    notFound();
  }

  const {
    report,
    companyName,
    companyIndustry,
    companyClassification,
    companyNextVisitReason,
    companyVisitPlanning,
  } = overview;
  const base = `/visit-reports/${uuid}/edit`;
  // Marketing and planning are the company's, edited on the company.
  const companyMarketingHref = `/companies/${report.companyUuid}/edit/marketing`;

  const categories = report.categories ?? [];
  const readers = report.readers ?? [];
  const plannedMonths = (companyVisitPlanning ?? []).filter(
    (month) => month.call || month.visit,
  ).length;

  const settingsSections: SectionCardData[] = [
    {
      title: "Visit Report",
      summary:
        [
          companyName,
          report.visitDate,
          report.contactMethod
            ? VISIT_REPORT_CONTACT_METHOD_LABELS[report.contactMethod]
            : null,
          report.hasTakenPlace ? "Took place" : "Not yet held",
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      href: `${base}/report`,
    },
    {
      title: "Contact",
      summary: report.contactUuid
        ? "The contact person seen"
        : "No contact person picked",
      href: `${base}/address`,
    },
    {
      title: "Details",
      summary: report.attentionPoint || report.remarks || "Nothing noted",
      href: `${base}/details`,
    },
    {
      title: "Company marketing",
      summary:
        [
          companyIndustry,
          companyClassification
            ? COMPANY_CLASSIFICATION_LABELS[companyClassification]
            : null,
          companyNextVisitReason
            ? `Next: ${VISIT_REPORT_REASON_LABELS[companyNextVisitReason]}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set on the company",
      href: companyMarketingHref,
    },
  ];

  const recordSections: SectionCardData[] = [
    {
      title: "Categories",
      summary:
        categories
          .map((category) => VISIT_REPORT_CATEGORY_LABELS[category])
          .join(", ") || "No categories picked",
      href: `${base}/categories`,
      count: categories.length,
    },
    {
      title: "Readers",
      summary: "Who should read this report, and who already has",
      href: `${base}/readers`,
      count: readers.length,
    },
    {
      title: "Company visit planning",
      summary: "Which months to call and which to visit — kept on the company",
      href: companyMarketingHref,
      count: plannedMonths,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/visit-reports"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Visit Reports
        </Link>
      </div>
      <PageHeading
        title={`Edit visit report${companyName ? ` — ${companyName}` : ""}`}
      />

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Report
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {settingsSections.map((section) => (
            <EditSectionCard key={section.title} {...section} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Lists
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {recordSections.map((section) => (
            <EditSectionCard key={section.title} {...section} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default VisitReportEditPage;
