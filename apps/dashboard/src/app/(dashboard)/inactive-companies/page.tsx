import { getInactiveCompanies } from "@/app/(dashboard)/inactive-companies/actions";
import { InactiveCompaniesTable } from "@/components/inactive-companies/inactive-companies-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const InactiveCompaniesPage = async () => {
  const rows = await getInactiveCompanies();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Inactive companies"
        description="Customers and prospects that have gone quiet for 12 months, plus any flagged inactive by hand. Accounts opened within the last year are not counted as inactive."
      />
      <InactiveCompaniesTable rows={rows} />
    </div>
  );
};

export default InactiveCompaniesPage;
