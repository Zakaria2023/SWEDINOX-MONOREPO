import { Suspense } from "react";
import { TextsTable } from "@/components/texts/texts-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const TextsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Texts"
        description="Manage reusable text blocks."
      />
      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <TextsTable />
      </Suspense>
    </div>
  );
};

export default TextsPage;
