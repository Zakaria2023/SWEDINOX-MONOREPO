import Link from "next/link";
import { getWarehouses } from "@/app/(dashboard)/warehouses/actions";
import { WarehousesTable } from "@/components/warehouses/warehouses-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const WarehousesPage = async () => {
  const warehouses = await getWarehouses();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Warehouses" />
        <Link
          href="/warehouses/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Warehouse
        </Link>
      </div>
      <WarehousesTable warehouses={warehouses} />
    </div>
  );
};

export default WarehousesPage;
