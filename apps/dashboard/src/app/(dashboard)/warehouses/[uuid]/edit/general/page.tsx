import { getWarehouseForEdit } from "@/app/(dashboard)/warehouses/[uuid]/edit/actions";
import { warehouseToFormValues } from "@/app/(dashboard)/warehouses/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { WarehouseGeneralEditor } from "@/components/warehouses/edit/warehouse-general-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const WarehouseGeneralPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const warehouse = await getWarehouseForEdit(uuid);

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link
          href={`/warehouses/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`General — ${warehouse.name}`} />
      <WarehouseGeneralEditor
        warehouseUuid={uuid}
        defaultValues={warehouseToFormValues(warehouse)}
      />
    </div>
  );
};

export default WarehouseGeneralPage;
