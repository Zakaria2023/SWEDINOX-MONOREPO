import { EditSectionCard } from "@/components/companies/edit/edit-section-card";
import { PageHeading } from "@/components/layout/page-heading";
import {
  COMPANY_CLASSIFICATION_LABELS,
  COMPANY_LANGUAGE_LABELS,
  COMPANY_ROLE_LABELS,
  CUSTOMER_GROUP_LABELS,
  INVOICE_FREQUENCY_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICING_METHOD_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyEditOverview } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

type SectionCardData = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

const CompanyEditPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const overview = await getCompanyEditOverview(uuid);

  if (!overview) {
    notFound();
  }

  const { company, counts } = overview;
  const base = `/companies/${uuid}/edit`;

  const settingsSections: SectionCardData[] = [
    {
      title: "Company Details",
      summary:
        [
          company.companyName,
          company.lang ? COMPANY_LANGUAGE_LABELS[company.lang] : null,
          company.correspName,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      href: `${base}/details`,
    },
    {
      title: "Roles",
      summary:
        (company.roles ?? [])
          .map((role) => COMPANY_ROLE_LABELS[role])
          .join(", ") || "No roles selected",
      href: `${base}/roles`,
    },
    {
      title: "Sales",
      summary:
        [
          company.customerGroup
            ? CUSTOMER_GROUP_LABELS[company.customerGroup]
            : null,
          company.representative
            ? SALES_REPRESENTATIVE_LABELS[company.representative]
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/sales`,
    },
    {
      title: "Marketing",
      summary:
        [
          company.industry,
          company.classification
            ? COMPANY_CLASSIFICATION_LABELS[company.classification]
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/marketing`,
    },
    {
      title: "Debtor & Finance",
      summary:
        [
          company.iban,
          company.paymentTerms
            ? INVOICE_PAYMENT_TERM_LABELS[company.paymentTerms]
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/debtor`,
    },
    {
      title: "Invoicing",
      summary:
        [
          company.invoicingMethod
            ? INVOICING_METHOD_LABELS[company.invoicingMethod]
            : null,
          company.invoiceFrequency
            ? INVOICE_FREQUENCY_LABELS[company.invoiceFrequency]
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/invoicing`,
    },
  ];

  const recordSections: SectionCardData[] = [
    {
      title: "Addresses",
      summary: "Delivery and billing addresses",
      href: `${base}/addresses`,
      count: counts.addresses,
    },
    {
      title: "Communication Settings",
      summary: "Per-document communication preferences",
      href: `${base}/communication-settings`,
      count: counts.communicationSettings,
    },
    {
      title: "Contacts",
      summary: "Contact persons for this company",
      href: `${base}/contacts`,
      count: counts.contacts,
    },
    {
      title: "Contracts",
      summary: "Contracts linked to this company",
      href: `${base}/contracts`,
      count: counts.contracts,
    },
    {
      title: "Texts",
      summary: "Text blocks printed on documents",
      href: `${base}/texts`,
      count: counts.texts,
    },
    {
      title: "Projects",
      summary: "Customer projects",
      href: `${base}/projects`,
      count: counts.projects,
    },
    {
      title: "Counter Orders",
      summary: "Orders taken at the counter",
      href: `${base}/counter-orders`,
      count: counts.counterOrders,
    },
    {
      title: "Products",
      summary: "Product records for this company",
      href: `${base}/products`,
      count: counts.products,
    },
    {
      title: "Visit Reports",
      summary: "Visit and call reports",
      href: `${base}/visit-reports`,
      count: counts.visitReports,
    },
    {
      title: "Purchase Orders",
      summary: "Purchase orders with this company as supplier",
      href: `${base}/purchase-orders`,
      count: counts.purchaseOrders,
    },
    {
      title: "Quotes",
      summary: "Sales quotes",
      href: `${base}/quotes`,
      count: counts.quotes,
    },
    {
      title: "Follow-ups",
      summary: "Follow-up reminders",
      href: `${base}/follow-ups`,
      count: counts.followUps,
    },
    {
      title: "Return Orders",
      summary: "Return orders",
      href: `${base}/return-orders`,
      count: counts.returnOrders,
    },
    {
      title: "Transporter Costs",
      summary: "Transport price agreements",
      href: `${base}/transporter-costs`,
      count: counts.transporterCosts,
    },
    {
      title: "Transporter Countries",
      summary: "Countries this transporter serves",
      href: `${base}/transporter-countries`,
      count: counts.transporterCountries,
    },
    {
      title: "Processings",
      summary: "Processing agreements",
      href: `${base}/processings`,
      count: counts.processings,
    },
    {
      title: "Customer Stock",
      summary: "Stock held for this customer",
      href: `${base}/customer-stock`,
      count: counts.customerStock,
    },
    {
      title: "Documents",
      summary: "Uploaded files",
      href: `${base}/documents`,
      count: (company.documents ?? []).length,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to company
        </Link>
      </div>
      <PageHeading title={`Edit ${company.companyName}`} />

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Company Settings
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {settingsSections.map((section) => (
            <EditSectionCard key={section.title} {...section} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Related Records
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

export default CompanyEditPage;
