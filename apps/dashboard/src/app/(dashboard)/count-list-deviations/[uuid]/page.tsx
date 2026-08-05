import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCountListDeviationDetail } from "@/app/(dashboard)/count-list-deviations/actions";
import { CountListDeviationDetailView } from "@/components/count-list-deviations/count-list-deviation-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CountListDeviationDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const deviation = await getCountListDeviationDetail(uuid);

  if (!deviation) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/count-list-deviations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Deviations in Count Lists
        </Link>
      </div>
      <PageHeading title={`Deviation #${deviation.id}`} />
      <CountListDeviationDetailView deviation={deviation} />
    </div>
  );
};

export default CountListDeviationDetailPage;
