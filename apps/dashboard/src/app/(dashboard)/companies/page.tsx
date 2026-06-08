import Link from "next/link";
import { CompaniesTable } from "./components/companies-table";

const CompaniesPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <p className="mt-2 text-gray-600">
          Manage company records and copy their UUIDs for related addresses.
        </p>
      </div>
      <Link
        href="/companies/add"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Company
      </Link>
    </div>

    <CompaniesTable />
  </div>
);

export default CompaniesPage;
