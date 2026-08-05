import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTextCategoryDetail } from "@/app/(dashboard)/text-categories/actions";
import { TextCategoryDetailView } from "@/components/text-categories/text-category-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TextCategoryDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const category = await getTextCategoryDetail(uuid);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/text-categories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Text Categories
        </Link>
      </div>
      <PageHeading title={category.name} />
      <TextCategoryDetailView category={category} />
    </div>
  );
};

export default TextCategoryDetailPage;
