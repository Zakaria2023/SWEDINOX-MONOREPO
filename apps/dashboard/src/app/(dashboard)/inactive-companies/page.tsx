import { getInactiveCompanies } from "@/app/(dashboard)/inactive-companies/actions";
import { InactiveCompaniesTable } from "@/components/inactive-companies/inactive-companies-table-content";

const InactiveCompaniesPage = async () => {
  const rows = await getInactiveCompanies();

  return (
    <div className="space-y-4">
      <InactiveCompaniesTable rows={rows} />
    </div>
  );
};

export default InactiveCompaniesPage;
