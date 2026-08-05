import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { TextCategoryForm } from "@/components/text-categories/text-category-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddTextCategoryPage = async () => {
  const categories = await getTextCategoriesForSelect();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/text-categories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Text Categories
        </Link>
      </div>
      <PageHeading title="Add Text Category" />
      <TextCategoryForm categories={categories} />
    </div>
  );
};

export default AddTextCategoryPage;
