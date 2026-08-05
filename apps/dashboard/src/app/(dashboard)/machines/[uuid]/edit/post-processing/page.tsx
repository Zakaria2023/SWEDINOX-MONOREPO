import { getMachineForEdit } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { MachinePostProcessingEditor } from "@/components/machines/edit/machine-post-processing-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const MachinePostProcessingPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const machine = await getMachineForEdit(uuid);

  if (!machine) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/machines/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Post-Processing — ${machine.name}`} />
      <MachinePostProcessingEditor
        machineUuid={uuid}
        postProcessings={machine.postProcessings.map((postProcessing) => ({
          option: postProcessing.option ?? "",
          preference: String(postProcessing.preference ?? 0),
          daysInSystem: String(postProcessing.daysInSystem ?? 0),
        }))}
      />
    </div>
  );
};

export default MachinePostProcessingPage;
