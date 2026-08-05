import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCapacityCheckDetail } from "@/app/(dashboard)/capacity-checks/actions";
import { CapacityCheckDetailView } from "@/components/capacity-checks/capacity-check-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatDateColumn } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CapacityCheckDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const check = await getCapacityCheckDetail(uuid);

  if (!check) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/capacity-checks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Capacity Checks
        </Link>
      </div>
      <PageHeading
        title={check.checkName ?? `Check #${check.id}`}
        description={formatDateColumn(check.checkDate)}
      />
      <CapacityCheckDetailView check={check} />
    </div>
  );
};

export default CapacityCheckDetailPage;
