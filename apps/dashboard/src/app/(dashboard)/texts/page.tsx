import { getTexts } from "@/app/(dashboard)/texts/actions";
import { TextsTable } from "@/components/texts/texts-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { textFilters } from "@/app/(dashboard)/texts/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const TextsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const texts = await getTexts(query);
  const companies = await getCompaniesForSelect();
  const categories = await getTextCategoriesForSelect();

  return (
    <div className="space-y-4">
      <PageHeading title="Texts" />
      <TextsTable page={texts} filters={textFilters(companies, categories)} />
    </div>
  );
};

export default TextsPage;
