import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getReturnLines } from "@/app/(dashboard)/return-lines/actions";
import { ReturnLinesTable } from "@/components/return-lines/return-lines-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ReturnLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const lines = await getReturnLines(query);

  return <ReturnLinesTable page={lines} />;
};

export default ReturnLinesPage;
