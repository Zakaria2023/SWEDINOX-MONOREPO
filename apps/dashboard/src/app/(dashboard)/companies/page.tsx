import Link from "next/link";
import { getCompanies } from "@/app/(dashboard)/companies/actions";
import { CompaniesTable } from "@/components/companies/companies-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CompaniesPage = async () => {
  const companies = await getCompanies();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Companies"
          description="Manage company records"
        />
        <Link
          href="/companies/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Company
        </Link>
      </div>
      <CompaniesTable companies={companies} />
    </div>
  );
};

export default CompaniesPage;
