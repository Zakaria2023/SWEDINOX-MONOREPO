import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMachineDetail } from "@/app/(dashboard)/machines/actions";
import { MachineDetailView } from "@/components/machines/machine-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const MachineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const machine = await getMachineDetail(uuid);

  if (!machine) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/machines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Machines
        </Link>
      </div>
      <PageHeading title={`${machine.code} — ${machine.name}`} />
      <MachineDetailView machine={machine} />
    </div>
  );
};

export default MachineDetailPage;
