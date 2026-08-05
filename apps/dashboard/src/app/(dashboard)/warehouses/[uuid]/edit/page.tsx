import { EditSectionCard } from "@/components/companies/edit/edit-section-card";
import { PageHeading } from "@/components/layout/page-heading";
import {
  WAREHOUSE_ADDRESS_LABELS,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWarehouseEditOverview } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

type SectionCardData = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

const WarehouseEditPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const overview = await getWarehouseEditOverview(uuid);

  if (!overview) {
    notFound();
  }

  const { warehouse, counts } = overview;
  const base = `/warehouses/${uuid}/edit`;

  const settingsSections: SectionCardData[] = [
    {
      title: "General",
      summary:
        [
          warehouse.locationType
            ? WAREHOUSE_LOCATION_TYPE_LABELS[warehouse.locationType]
            : null,
          warehouse.address
            ? WAREHOUSE_ADDRESS_LABELS[warehouse.address]
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      href: `${base}/general`,
    },
    {
      title: "Status",
      summary: warehouse.blocked
        ? `Blocked${
            warehouse.blockReason
              ? ` — ${WAREHOUSE_BLOCK_REASON_LABELS[warehouse.blockReason]}`
              : ""
          }`
        : "In use",
      href: `${base}/status`,
    },
    {
      title: "Count Workorders",
      summary: "How stock counts are raised, released and printed",
      href: `${base}/count-workorders`,
    },
    {
      title: "Picking Workorders",
      summary: "How picking is processed, released and printed",
      href: `${base}/picking-workorders`,
    },
    {
      title: "Surface Treatment",
      summary: "Fetch workorders for surface treatment",
      href: `${base}/surface-treatment`,
    },
    {
      title: "Sawing",
      summary: "Fetch workorders for sawing",
      href: `${base}/sawing`,
    },
    {
      title: "Pick-up Workorders",
      summary: "The default pick-up location and its printers",
      href: `${base}/pickup-workorders`,
    },
    {
      title: "Print Settings",
      summary: "Which printer gets what, and how labels are named",
      href: `${base}/print-settings`,
    },
    {
      title: "Miscellaneous",
      summary: "Workorder slips, CSV naming and transport",
      href: `${base}/miscellaneous`,
    },
  ];

  const recordSections: SectionCardData[] = [
    {
      title: "Load Locations",
      summary: "Which loading spot serves each transport region",
      href: `${base}/load-locations`,
      count: counts.loadLocations,
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
          href="/warehouses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Warehouses
        </Link>
      </div>
      <PageHeading title={`Edit ${warehouse.name}`} />

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Warehouse Settings
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

export default WarehouseEditPage;
