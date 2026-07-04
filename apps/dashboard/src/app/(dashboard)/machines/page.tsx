import Link from "next/link";
import { getMachines } from "@/app/(dashboard)/machines/actions";
import { MachinesTable } from "@/components/machines/machines-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const MachinesPage = async () => {
  const machines = await getMachines();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading title="Machines" description="Manage production machines" />
        <Link
          href="/machines/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Machine
        </Link>
      </div>
      <MachinesTable machines={machines} />
    </div>
  );
};

export default MachinesPage;
