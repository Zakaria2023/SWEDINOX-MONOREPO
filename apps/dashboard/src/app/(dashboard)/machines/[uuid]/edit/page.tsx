import { EditSectionCard } from "@/components/companies/edit/edit-section-card";
import { PageHeading } from "@/components/layout/page-heading";
import {
  MACHINE_CAPACITY_UNIT_CODES,
  MACHINE_LOADING_LABELS,
  MACHINE_OPTION_LABELS,
  MACHINE_PRODUCTION_LABELS,
} from "@/lib/labels";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMachineEditOverview } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

type SectionCardData = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

const MachineEditPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const overview = await getMachineEditOverview(uuid);

  if (!overview) {
    notFound();
  }

  const { machine, stockLocationName, counts } = overview;
  const base = `/machines/${uuid}/edit`;

  const settingsSections: SectionCardData[] = [
    {
      title: "General",
      summary:
        [
          machine.code,
          MACHINE_OPTION_LABELS[machine.option],
          MACHINE_PRODUCTION_LABELS[machine.production],
          machine.loading ? MACHINE_LOADING_LABELS[machine.loading] : null,
          stockLocationName,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      href: `${base}/general`,
    },
    {
      title: "Dimensions & Remarks",
      summary:
        machine.minLengthMm === null && machine.maxLengthMm === null
          ? "No length limits set"
          : `${machine.minLengthMm ?? "—"} – ${machine.maxLengthMm ?? "—"} mm`,
      href: `${base}/dimensions`,
    },
    {
      title: "Availability",
      summary: machine.outOfBusiness
        ? "Out of business for a set period"
        : "In business",
      href: `${base}/availability`,
    },
    {
      title: "Capacity",
      summary:
        machine.averageDailyCapacity === null
          ? "No average daily capacity set"
          : `${machine.averageDailyCapacity} ${
              machine.averageDailyCapacityUnit
                ? MACHINE_CAPACITY_UNIT_CODES[machine.averageDailyCapacityUnit]
                : ""
            }`.trim(),
      href: `${base}/capacity`,
    },
  ];

  const recordSections: SectionCardData[] = [
    {
      title: "Products",
      summary: "What this machine can run, and how fast",
      href: `${base}/products`,
      count: counts.products,
    },
    {
      title: "Post-Processing",
      summary: "Steps that follow work on this machine",
      href: `${base}/post-processing`,
      count: counts.postProcessings,
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
          href="/machines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Machines
        </Link>
      </div>
      <PageHeading title={`Edit ${machine.name}`} />

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Machine Settings
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

export default MachineEditPage;
