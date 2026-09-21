import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getReturnLines } from "@/app/(dashboard)/return-lines/actions";
import { ReturnLinesTable } from "@/components/return-lines/return-lines-table-content";
import { GenerateReturnLinesButton } from "@/components/return-lines/generate-return-lines-button";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ReturnLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const lines = await getReturnLines(query);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <GenerateReturnLinesButton />
      </div>
      <ReturnLinesTable page={lines} />
    </div>
  );
};

export default ReturnLinesPage;
