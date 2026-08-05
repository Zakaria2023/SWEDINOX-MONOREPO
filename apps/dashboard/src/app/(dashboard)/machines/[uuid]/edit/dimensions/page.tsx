import { getMachineForEdit } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { machineToFormValues } from "@/app/(dashboard)/machines/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { MachineDimensionsEditor } from "@/components/machines/edit/machine-dimensions-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const MachineDimensionsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const machine = await getMachineForEdit(uuid);

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
      <PageHeading title={`Dimensions & Remarks — ${machine.name}`} />
      <MachineDimensionsEditor
        machineUuid={uuid}
        defaultValues={machineToFormValues(machine)}
      />
    </div>
  );
};

export default MachineDimensionsPage;
