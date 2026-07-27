import {
  getConvertibleQuotes,
  getQuoteLines,
} from "@/app/(dashboard)/quote-lines/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ConvertQuoteToOrder } from "@/components/quote-lines/convert-quote-to-order";
import { QuoteLinesTable } from "@/components/quote-lines/quote-lines-table-content";

const QuoteLinesPage = async () => {
  const [rows, convertibleQuotes] = await Promise.all([
    getQuoteLines(),
    getConvertibleQuotes(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Quote lines"
        description="Every quoted line with its dimensions, discounts and margin"
      />
      <ConvertQuoteToOrder quotes={convertibleQuotes} />
      <QuoteLinesTable rows={rows} />
    </div>
  );
};

export default QuoteLinesPage;
