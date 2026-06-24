import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TextCategoriesTable } from "@/components/text-categories/text-categories-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const TextCategoriesPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Text Categories"
          description="Manage the category tree for reusable texts."
        />
        <Link
          href="/text-categories/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Text Category
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={5} />}>
        <TextCategoriesTable />
      </Suspense>
    </div>
  );
};

export default TextCategoriesPage;
