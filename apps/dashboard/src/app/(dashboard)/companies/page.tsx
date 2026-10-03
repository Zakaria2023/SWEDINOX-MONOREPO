import { getCompanies } from "@/app/(dashboard)/companies/actions";
import { CompaniesTable } from "@/components/companies/companies-table-content";

const CompaniesPage = async () => {
  const companies = await getCompanies();

  return <CompaniesTable companies={companies} />;
};

export default CompaniesPage;
