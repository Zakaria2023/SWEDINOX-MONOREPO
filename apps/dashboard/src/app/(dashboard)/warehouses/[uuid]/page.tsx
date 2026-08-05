import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getWarehouseDetail } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseDetailView } from "@/components/warehouses/warehouse-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

// `Warehouses` holds root warehouses, their sub-sections and locations in one
// table, so this screen serves all three overviews. The back link points at the
// overview the row belongs to rather than always at /warehouses.
const WarehouseDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const warehouse = await getWarehouseDetail(uuid);

  if (!warehouse) {
    notFound();
  }

  const origin =
    warehouse.parentUuid === null
      ? { href: "/warehouses", label: "Warehouses" }
      : warehouse.type === "location"
        ? { href: "/locations", label: "Locations" }
        : { href: "/warehouse-sub-sections", label: "Warehouse Sub-sections" };

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href={origin.href}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {origin.label}
        </Link>
      </div>
      <PageHeading title={warehouse.name} />
      <WarehouseDetailView warehouse={warehouse} />
    </div>
  );
};

export default WarehouseDetailPage;
