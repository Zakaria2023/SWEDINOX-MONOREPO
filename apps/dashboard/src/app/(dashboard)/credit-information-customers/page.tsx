import { getCreditInformationCustomers } from "@/app/(dashboard)/credit-information-customers/actions";
import { CreditInformationCustomersTable } from "@/components/credit-information-customers/credit-information-customers-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CreditInformationCustomersPage = async () => {
  const rows = await getCreditInformationCustomers();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Credit information customers" />
      <CreditInformationCustomersTable rows={rows} />
    </div>
  );
};

export default CreditInformationCustomersPage;
