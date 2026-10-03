import { Suspense } from "react";
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
    <Suspense
      key={JSON.stringify(query)}
      fallback={<DataTableFallback columnCount={6} />}
    >
      <ComplaintsTable query={query} />
    </Suspense>
  );
};

export default ComplaintsPage;
