import { getInactiveCompanies } from "@/app/(dashboard)/inactive-companies/actions";
import { InactiveCompaniesTable } from "@/components/inactive-companies/inactive-companies-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const InactiveCompaniesPage = async () => {
  const rows = await getInactiveCompanies();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Inactive companies"
        description="Customers and prospects with no order in the last 12 months"
      />
      <InactiveCompaniesTable rows={rows} />
    </div>
  );
};

export default InactiveCompaniesPage;
