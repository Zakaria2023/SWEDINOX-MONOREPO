import { getWarehouseForEdit } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { warehouseToFormValues } from "@/app/(dashboard)/warehouses/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { WarehouseMiscellaneousEditor } from "@/components/warehouses/edit/warehouse-miscellaneous-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const WarehouseMiscellaneousPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [warehouse, companies] = await Promise.all([
    getWarehouseForEdit(uuid),
    getCompaniesForSelect(),
  ]);

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href={`/warehouses/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading
        title={`Miscellaneous — ${warehouse.name}`}
        description="Workorder slips, CSV naming and who transports for this warehouse"
      />
      <WarehouseMiscellaneousEditor
        warehouseUuid={uuid}
        defaultValues={warehouseToFormValues(warehouse)}
        companies={companies}
      />
    </div>
  );
};

export default WarehouseMiscellaneousPage;
