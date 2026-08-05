import { getMachineForEdit } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { machineToFormValues } from "@/app/(dashboard)/machines/mappers";
import { getMachineStockLocationsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { MachineGeneralEditor } from "@/components/machines/edit/machine-general-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const MachineGeneralPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [machine, stockLocations] = await Promise.all([
    getMachineForEdit(uuid),
    getMachineStockLocationsForSelect(),
  ]);

  if (!machine) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href={`/machines/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`General — ${machine.name}`} />
      <MachineGeneralEditor
        machineUuid={uuid}
        defaultValues={machineToFormValues(machine)}
        stockLocations={stockLocations}
      />
    </div>
  );
};

export default MachineGeneralPage;
