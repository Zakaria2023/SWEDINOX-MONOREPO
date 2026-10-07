import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getReturnLines } from "@/app/(dashboard)/return-lines/actions";
import { returnLineFilters } from "@/app/(dashboard)/return-lines/filters";
import { ReturnLinesTable } from "@/components/return-lines/return-lines-table-content";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ReturnLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const lines = await getReturnLines(query);
  const userNames = await getClerkUserNames();

  return (
    <ReturnLinesTable
      page={lines}
      filters={returnLineFilters()}
      userNames={userNames}
    />
  );
};

export default ReturnLinesPage;
