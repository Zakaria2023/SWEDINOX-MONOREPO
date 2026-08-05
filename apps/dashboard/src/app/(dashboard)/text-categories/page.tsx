import Link from "next/link";
import { getTextCategories } from "@/app/(dashboard)/text-categories/actions";
import { TextCategoriesTable } from "@/components/text-categories/text-categories-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TextCategoriesPage = async () => {
  const categories = await getTextCategories();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading title="Text Categories" />
        <Link
          href="/text-categories/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Text Category
        </Link>
      </div>
      <TextCategoriesTable categories={categories} />
    </div>
  );
};

export default TextCategoriesPage;
