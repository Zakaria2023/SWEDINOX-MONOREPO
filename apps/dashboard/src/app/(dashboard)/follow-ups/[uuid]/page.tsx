import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getFollowUpDetail } from "@/app/(dashboard)/follow-ups/actions";
import { FollowUpDetailView } from "@/components/follow-ups/follow-up-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const FollowUpDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const followUp = await getFollowUpDetail(uuid);

  if (!followUp) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/follow-ups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Follow-ups
        </Link>
      </div>
      <PageHeading
        title={followUp.companyName ?? `Follow-up #${followUp.id}`}
        description={followUp.date ?? undefined}
      />
      <FollowUpDetailView followUp={followUp} />
    </div>
  );
};

export default FollowUpDetailPage;
