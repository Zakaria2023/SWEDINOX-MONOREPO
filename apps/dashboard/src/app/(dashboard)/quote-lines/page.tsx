import { parseTableQuery, SearchParams } from "@/lib/table-query";
import {
  getConvertibleQuotes,
  getQuoteLines,
} from "@/app/(dashboard)/quote-lines/actions";
import { getClerkUserNames } from "@/lib/server/clerk";
import { ConvertQuoteToOrder } from "@/components/quote-lines/convert-quote-to-order";
import { QuoteLinesTable } from "@/components/quote-lines/quote-lines-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const QuoteLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const rows = await getQuoteLines(query);
  const convertibleQuotes = await getConvertibleQuotes();
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <ConvertQuoteToOrder quotes={convertibleQuotes} />
      <QuoteLinesTable page={rows} userNames={userNames} />
    </div>
  );
};

export default QuoteLinesPage;
