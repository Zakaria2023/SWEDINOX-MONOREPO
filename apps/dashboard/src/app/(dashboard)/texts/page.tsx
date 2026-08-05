import { getTexts } from "@/app/(dashboard)/texts/actions";
import { TextsTable } from "@/components/texts/texts-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TextsPage = async () => {
  const texts = await getTexts();

  return (
    <div className="space-y-4">
      <PageHeading title="Texts" />
      <TextsTable texts={texts} />
    </div>
  );
};

export default TextsPage;
