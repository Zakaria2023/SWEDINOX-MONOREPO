import {
  getConvertibleQuotes,
  getQuoteLines,
} from "@/app/(dashboard)/quote-lines/actions";
import { getClerkUserNames } from "@/lib/server/clerk";
import { ConvertQuoteToOrder } from "@/components/quote-lines/convert-quote-to-order";
import { QuoteLinesTable } from "@/components/quote-lines/quote-lines-table-content";

const QuoteLinesPage = async () => {
  const [rows, convertibleQuotes] = await Promise.all([
    getQuoteLines(),
    getConvertibleQuotes(),
  ]);
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <ConvertQuoteToOrder quotes={convertibleQuotes} />
      <QuoteLinesTable rows={rows} userNames={userNames} />
    </div>
  );
};

export default QuoteLinesPage;
