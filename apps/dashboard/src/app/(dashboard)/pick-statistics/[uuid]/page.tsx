import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPickStatisticDetail } from "@/app/(dashboard)/pick-statistics/actions";
import { PickStatisticDetailView } from "@/components/pick-statistics/pick-statistic-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PickStatisticDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const statistic = await getPickStatisticDetail(uuid);

  if (!statistic) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/pick-statistics"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Pick Statistics
        </Link>
      </div>
      <PageHeading
        title={
          [statistic.productCode, statistic.productName]
            .filter(Boolean)
            .join(" — ") || "Pick statistics"
        }
        description={`${statistic.year}-${String(statistic.month).padStart(2, "0")}`}
      />
      <PickStatisticDetailView statistic={statistic} />
    </div>
  );
};

export default PickStatisticDetailPage;
