import { getQuotes } from "@/app/(dashboard)/quotes/actions";
import { quoteFilters } from "@/app/(dashboard)/quotes/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { QuotesTable } from "@/components/quotes/quotes-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const QuotesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const quotes = await getQuotes(query);
  const companies = await getCompaniesForSelect();

  return <QuotesTable page={quotes} filters={quoteFilters(companies)} />;
};

export default QuotesPage;
