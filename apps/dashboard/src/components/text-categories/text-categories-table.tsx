import { getTextCategories } from "@/app/(dashboard)/text-categories/actions";
import { TextCategoriesTableContent } from "@/components/text-categories/text-categories-table-content";

export const TextCategoriesTable = async () => {
  const categories = await getTextCategories();

  return <TextCategoriesTableContent categories={categories} />;
};
