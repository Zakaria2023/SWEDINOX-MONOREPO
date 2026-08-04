import { EditSectionCard } from "@/components/companies/edit/edit-section-card";
import { PageHeading } from "@/components/layout/page-heading";
import { formatMoney } from "@/lib/helpers";
import {
  COUNTER_ORDER_PRIORITY_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/labels";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCounterOrderEditOverview } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

type SectionCardData = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

const CounterOrderEditPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const overview = await getCounterOrderEditOverview(uuid);

  if (!overview) {
    notFound();
  }

  const { order, companyName, counts } = overview;
  const base = `/counter-orders/${uuid}/edit`;

  const orderTypeFlags = [
    order.isPickup ? "Pickup" : null,
    order.isIncidental ? "Incidental" : null,
    order.isOverlength ? "Overlength" : null,
  ].filter(Boolean);

  const settingsSections: SectionCardData[] = [
    {
      title: "Counter Order",
      summary:
        [
          companyName,
          order.status ? COUNTER_ORDER_STATUS_LABELS[order.status] : null,
          order.priority
            ? COUNTER_ORDER_PRIORITY_LABELS[order.priority]
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      href: `${base}/header`,
    },
    {
      title: "Order Type",
      summary:
        orderTypeFlags.length > 0 ? orderTypeFlags.join(", ") : "Standard",
      href: `${base}/order-type`,
    },
    {
      title: "Delivery",
      summary:
        [
          order.deliveryTerms
            ? DELIVERY_TERM_LABELS[order.deliveryTerms]
            : null,
          order.deliveryDate,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/delivery`,
    },
    {
      title: "Logistics",
      summary:
        [
          order.transportMode
            ? TRANSPORT_MODE_LABELS[order.transportMode]
            : null,
          order.transportBlockage ? "Transport blocked" : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Nothing special",
      href: `${base}/logistics`,
    },
    {
      title: "Finances",
      summary:
        [
          order.paymentTerms
            ? INVOICE_PAYMENT_TERM_LABELS[order.paymentTerms]
            : null,
          order.financialBlockage ? "Financially blocked" : null,
          order.invoiceBlockage ? "Invoice blocked" : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/finances`,
    },
    {
      title: "Summary",
      summary: `${formatMoney(Number(order.amountExVat ?? 0))} ex VAT · ${
        order.weightKg ?? "0.000"
      } kg`,
      href: `${base}/summary`,
    },
  ];

  const recordSections: SectionCardData[] = [
    {
      title: "Order Lines",
      summary: "What was sold, in what quantity and at what price",
      href: `${base}/order-lines`,
      count: counts.items,
    },
    {
      title: "Surcharges",
      summary: "What is charged on top of the material",
      href: `${base}/surcharges`,
      count: counts.surcharges,
    },
    {
      title: "Contracts",
      summary: "Which of this customer's contracts this order runs under",
      href: `${base}/contracts`,
      count: counts.contracts,
    },
    {
      title: "Texts",
      summary: "Text blocks printed on this order's documents",
      href: `${base}/texts`,
      count: counts.texts,
    },
    {
      title: "Documents",
      summary: "Uploaded files",
      href: `${base}/documents`,
      count: counts.documents,
    },
  ];

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/counter-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Counter Orders
        </Link>
      </div>
      <PageHeading
        title={`Edit counter order #${order.id}`}
        description="Pick a section to edit it on its own page"
      />

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Order Settings
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {settingsSections.map((section) => (
            <EditSectionCard key={section.title} {...section} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
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

export default CounterOrderEditPage;
