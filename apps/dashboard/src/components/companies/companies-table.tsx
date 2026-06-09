import { getCompanies } from "@/app/(dashboard)/companies/actions";
import { CompaniesTableContent } from "@/components/companies/companies-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const CompaniesTable = async () => {
  noStore();

  const initialCompanies = await getCompanies();

  return <CompaniesTableContent initialCompanies={initialCompanies} />;
};
