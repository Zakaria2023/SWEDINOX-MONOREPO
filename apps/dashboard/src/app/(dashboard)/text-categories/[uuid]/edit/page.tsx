import {
  getTextCategoriesForSelect,
  getTextCategoryForEdit,
} from "@/app/(dashboard)/text-categories/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { TextCategoryForm } from "@/components/text-categories/text-category-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditTextCategoryPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [category, categories] = await Promise.all([
    getTextCategoryForEdit(uuid),
    getTextCategoriesForSelect(uuid),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link
          href="/text-categories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Text Categories
        </Link>
      </div>
      <PageHeading title={`Edit ${category.name}`} />
      <TextCategoryForm
        categories={categories}
        textCategoryUuid={uuid}
        defaultValues={{
          parentUuid: category.parentUuid ?? "",
          name: category.name,
          description: category.description ?? "",
          usageCategoriesJson: category.usageCategoriesJson,
          sequenceNumber: category.sequenceNumber,
          isActive: category.isActive,
        }}
      />
    </div>
  );
};

export default EditTextCategoryPage;
