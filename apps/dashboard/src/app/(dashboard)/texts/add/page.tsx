import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { TextForm } from "@/components/texts/text-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddTextPage = async () => {
  const categories = await getTextCategoriesForSelect();

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/texts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Texts
        </Link>
      </div>
      <PageHeading
        title="Add Text"
        description="Create a reusable text block."
      />
      <TextForm categories={categories} />
    </div>
  );
};

export default AddTextPage;
