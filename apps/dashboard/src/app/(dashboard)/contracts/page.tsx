import Link from "next/link";
import { Plus } from "lucide-react";
import { getContracts } from "@/app/(dashboard)/contracts/actions";
import { ContractsTable } from "@/components/contracts/contracts-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ContractsPage = async () => {
  const contracts = await getContracts();

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
      <ContractsTable contracts={contracts} />
    </div>
  );
};

export default ContractsPage;
