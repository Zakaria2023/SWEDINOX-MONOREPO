import { Suspense } from "react";
import Link from "next/link";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ComplaintsPage = async ({ searchParams }: Props) => {
  // Resolved before the boundary rather than inside it: awaiting in the JSX
  // would make the whole page wait, which is the opposite of what the Suspense
  // is there for. The table's own queries are what streams.
  const query = parseTableQuery(await searchParams);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/complaints/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Complaint
        </Link>
      </div>
      <Suspense
        key={JSON.stringify(query)}
        fallback={<DataTableFallback columnCount={6} />}
      >
        <ComplaintsTable query={query} />
      </Suspense>
    </div>
  );
};

export default ComplaintsPage;
