import { getCompanies } from "@/app/(dashboard)/companies/actions";
import { CompaniesTableContent } from "@/components/companies/companies-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const CompaniesTable = async () => {
  noStore();

  const companies = await getCompanies();

  return <CompaniesTableContent companies={companies} />;
};
