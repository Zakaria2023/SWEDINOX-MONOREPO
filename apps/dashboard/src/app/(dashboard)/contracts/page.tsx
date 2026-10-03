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
    <ContractsTable
      page={contracts}
      filters={contractFilters(companies, contractGroups)}
    />
  );
};

export default ContractsPage;
