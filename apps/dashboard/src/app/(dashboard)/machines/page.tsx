import { Suspense } from "react";
import Link from "next/link";
import { MachinesTable } from "@/components/machines/machines-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const MachinesPage = () => {
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

      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <MachinesTable />
      </Suspense>
    </div>
  );
};

export default MachinesPage;
