import {
  getContractsPerCustomer,
  getContractCodesForCustomers,
} from "@/app/(dashboard)/contracts/actions";
import { contractsPerCustomerFilters } from "@/app/(dashboard)/contracts-per-customer/filters";
import { ContractsPerCustomerTable } from "@/components/contracts-per-customer/contracts-per-customer-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ContractsPerCustomerPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getContractsPerCustomer(query);
  const codes = await getContractCodesForCustomers();

  return (
    <div className="space-y-4">
      <ContractsPerCustomerTable
        page={page}
        filters={contractsPerCustomerFilters(codes)}
      />
    </div>
  );
};

export default ContractsPerCustomerPage;
