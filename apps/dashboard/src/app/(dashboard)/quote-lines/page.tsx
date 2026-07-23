import {
  getConvertibleQuotes,
  getQuoteLines,
} from "@/app/(dashboard)/quote-lines/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ConvertQuoteToOrder } from "@/components/quote-lines/convert-quote-to-order";
import { QuoteLinesTable } from "@/components/quote-lines/quote-lines-table-content";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const QuoteLinesPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const [rows, convertibleQuotes] = await Promise.all([
    getQuoteLines({ year: yearNum, month: monthNum }),
    getConvertibleQuotes(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Quote lines"
        description="Every quoted line with its dimensions, discounts and margin"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <ConvertQuoteToOrder quotes={convertibleQuotes} />
      <QuoteLinesTable rows={rows} />
    </div>
  );
};

export default QuoteLinesPage;
