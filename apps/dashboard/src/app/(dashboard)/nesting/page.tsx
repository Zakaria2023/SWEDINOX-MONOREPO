import { getNesting } from "@/app/(dashboard)/nesting/actions";
import { NestingTable } from "@/components/nesting/nesting-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const NestingPage = async ({ searchParams }: Props) => {
  const page = await getNesting(parseTableQuery(await searchParams));

  return (
    <div className="space-y-4">
      <NestingTable page={page} filters={[]} />
    </div>
  );
};

export default NestingPage;
