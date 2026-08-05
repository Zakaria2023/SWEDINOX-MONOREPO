import { getWarehouseForEdit } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { getWarehouseLocationsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { warehouseToFormValues } from "@/app/(dashboard)/warehouses/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { WarehousePickupWorkordersEditor } from "@/components/warehouses/edit/warehouse-pickup-workorders-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const WarehousePickupWorkordersPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [warehouse, warehouseLocations] = await Promise.all([
    getWarehouseForEdit(uuid),
    getWarehouseLocationsForSelect(),
  ]);

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/warehouses/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Pick-up Workorders — ${warehouse.name}`} />
      <WarehousePickupWorkordersEditor
        warehouseUuid={uuid}
        defaultValues={warehouseToFormValues(warehouse)}
        warehouseLocations={warehouseLocations}
      />
    </div>
  );
};

export default WarehousePickupWorkordersPage;
