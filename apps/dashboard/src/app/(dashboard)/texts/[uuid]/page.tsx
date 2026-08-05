import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTextDetail } from "@/app/(dashboard)/texts/actions";
import { TextDetailView } from "@/components/texts/text-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TextDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const text = await getTextDetail(uuid);

  if (!text) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
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
        title={text.title}
        description={text.textCategoryName ?? undefined}
      />
      <TextDetailView text={text} />
    </div>
  );
};

export default TextDetailPage;
