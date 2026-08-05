import { EditSectionCard } from "@/components/companies/edit/edit-section-card";
import { PageHeading } from "@/components/layout/page-heading";
import {
  ARTICLE_GROUP_LABELS,
  PRODUCT_SHAPE_LABELS,
  REVENUE_GROUP_LABELS,
  STOCK_MODE_LABELS,
} from "@/lib/labels";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductGroupEditOverview } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

type SectionCardData = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

const ProductGroupEditPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const overview = await getProductGroupEditOverview(uuid);

  if (!overview) {
    notFound();
  }

  const { group, parentName, counts } = overview;
  const base = `/product-groups/${uuid}/edit`;

  const settingsSections: SectionCardData[] = [
    {
      title: "General",
      summary:
        [
          parentName ? `Under ${parentName}` : "Top level",
          group.productShape ? PRODUCT_SHAPE_LABELS[group.productShape] : null,
          group.articleGroup ? ARTICLE_GROUP_LABELS[group.articleGroup] : null,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      href: `${base}/general`,
    },
    {
      title: "Basis",
      summary: [group.length, group.width, group.thickness].some(Boolean)
        ? `${group.length ?? "—"} × ${group.width ?? "—"} × ${group.thickness ?? "—"}`
        : "No dimensions set",
      href: `${base}/basis`,
    },
    {
      title: "Purchase",
      summary: group.blockedForPurchasing
        ? "Blocked for purchasing"
        : `Delivery time ${group.deliveryTime ?? 0}`,
      href: `${base}/purchase`,
    },
    {
      title: "Sales",
      summary:
        [
          group.revenueGroup ? REVENUE_GROUP_LABELS[group.revenueGroup] : null,
          group.severalBlockedForSales ? "Blocked for sales" : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Not set",
      href: `${base}/sales`,
    },
    {
      title: "Stock Policy",
      summary: `Min ${group.minStockMode ? STOCK_MODE_LABELS[group.minStockMode] : "—"} · Max ${
        group.maxStockMode ? STOCK_MODE_LABELS[group.maxStockMode] : "—"
      }`,
      href: `${base}/stock-policy`,
    },
    {
      title: "Warehouse Control",
      summary: "Receipt, labelling and floor tolerances",
      href: `${base}/warehouse-control`,
    },
  ];

  const recordSections: SectionCardData[] = [
    {
      title: "Suppliers",
      summary: "Who supplies this group, and on what terms",
      href: `${base}/suppliers`,
      count: counts.suppliers,
    },
    {
      title: "Documents",
      summary: "Uploaded files",
      href: `${base}/documents`,
      count: counts.documents,
    },
  ];

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link
          href="/product-groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Product Groups
        </Link>
      </div>
      <PageHeading title={`Edit ${group.name}`} />

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Product Group Settings
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

export default ProductGroupEditPage;
