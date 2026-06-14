import { getCompanies } from "@/app/(dashboard)/companies/actions";
import { CompaniesTableContent } from "@/components/companies/companies-table-content";

export const CompaniesTable = async () => {
  const companies = await getCompanies();

  return <CompaniesTableContent companies={companies} />;
};
