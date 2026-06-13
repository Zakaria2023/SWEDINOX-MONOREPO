import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ContractsTable } from "@/components/contracts/contracts-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ContractsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Contracts"
          description="Standalone contract records."
        />
        <Link
          href="/contracts/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Contract
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={4} />}>
        <ContractsTable />
      </Suspense>
    </div>
  );
};

export default ContractsPage;
