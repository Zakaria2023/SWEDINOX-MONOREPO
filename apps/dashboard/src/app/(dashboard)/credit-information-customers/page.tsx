import { getCreditInformationCustomers } from "@/app/(dashboard)/credit-information-customers/actions";
import { CreditInformationCustomersTable } from "@/components/credit-information-customers/credit-information-customers-table-content";

const CreditInformationCustomersPage = async () => {
  const rows = await getCreditInformationCustomers();

  return (
    <div className="space-y-4">
      <CreditInformationCustomersTable rows={rows} />
    </div>
  );
};

export default CreditInformationCustomersPage;
