import { getTexts } from "@/app/(dashboard)/texts/actions";
import { TextsTableContent } from "@/components/texts/texts-table-content";

export const TextsTable = async () => {
  const texts = await getTexts();

  return <TextsTableContent texts={texts} />;
};
