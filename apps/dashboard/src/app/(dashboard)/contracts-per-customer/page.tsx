import { getContractsPerCustomer } from "@/app/(dashboard)/contracts/actions";
import { ContractsPerCustomerTable } from "@/components/contracts-per-customer/contracts-per-customer-table-content";

const ContractsPerCustomerPage = async () => {
  const rows = await getContractsPerCustomer();

  return (
    <div className="space-y-4">
      <ContractsPerCustomerTable rows={rows} />
    </div>
  );
};

export default ContractsPerCustomerPage;
