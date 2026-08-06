import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTextDetail } from "@/app/(dashboard)/texts/actions";
import { TextDetailView } from "@/components/texts/text-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TextDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const text = await getTextDetail(uuid);

  if (!text) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/texts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Texts
        </Link>
      </div>
      <PageHeading title={text.title} />
      <TextDetailView text={text} userNames={userNames} />
    </div>
  );
};

export default TextDetailPage;
