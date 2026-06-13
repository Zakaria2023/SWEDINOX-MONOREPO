import { Suspense } from "react";
import { CompaniesTable } from "@/components/companies/companies-table";
import { PageHeading } from "@/components/layout/page-heading";
import { TranslatedLink } from "@/components/layout/translated-link";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const CompaniesPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          titleKey="companies-page.title"
          descriptionKey="companies-page.description"
        />
        <TranslatedLink
          href="/companies/add"
          labelKey="companies-page.new-company"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        />
      </div>
      <Suspense fallback={<DataTableFallback columnCount={2} />}>
        <CompaniesTable />
      </Suspense>
    </div>
  );
};

export default CompaniesPage;
