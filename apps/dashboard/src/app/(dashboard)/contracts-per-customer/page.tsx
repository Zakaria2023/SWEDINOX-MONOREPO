import { getContractsPerCustomer } from "@/app/(dashboard)/contracts/actions";
import { ContractsPerCustomerTable } from "@/components/contracts-per-customer/contracts-per-customer-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ContractsPerCustomerPage = async () => {
  const rows = await getContractsPerCustomer();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Contracts per Customer / Prospect"
        description="Overview of all contracts linked to customers and prospects"
      />
      <ContractsPerCustomerTable rows={rows} />
    </div>
  );
};

export default ContractsPerCustomerPage;
