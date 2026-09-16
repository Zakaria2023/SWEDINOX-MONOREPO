import Link from "next/link";
import { Plus } from "lucide-react";
import { getContracts } from "@/app/(dashboard)/contracts/actions";
import { ContractsTable } from "@/components/contracts/contracts-table-content";
import { contractFilters } from "@/app/(dashboard)/contracts/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractGroups } from "@/app/(dashboard)/contract-groups/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ContractsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const contracts = await getContracts(query);
  const companies = await getCompaniesForSelect();
  const contractGroups = await getContractGroups();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/contracts/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Contract
        </Link>
      </div>
      <ContractsTable
        page={contracts}
        filters={contractFilters(companies, contractGroups)}
      />
    </div>
  );
};

export default ContractsPage;
