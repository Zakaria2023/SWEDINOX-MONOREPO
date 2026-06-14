import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TextsTable } from "@/components/texts/texts-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const TextsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Texts"
          description="Manage reusable text blocks and usage categories."
        />
        <Link
          href="/texts/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Text
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <TextsTable />
      </Suspense>
    </div>
  );
};

export default TextsPage;
