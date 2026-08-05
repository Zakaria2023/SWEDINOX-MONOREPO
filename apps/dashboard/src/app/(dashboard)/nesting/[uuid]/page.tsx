import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getNestingDetail } from "@/app/(dashboard)/nesting/actions";
import { NestingDetailView } from "@/components/nesting/nesting-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const NestingDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const nesting = await getNestingDetail(uuid);

  if (!nesting) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/nesting"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Nesting
        </Link>
      </div>
      <PageHeading title={nesting.nest ?? `Nest #${nesting.id}`} />
      <NestingDetailView nesting={nesting} />
    </div>
  );
};

export default NestingDetailPage;
