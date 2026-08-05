import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getFreightMovementDetail } from "@/app/(dashboard)/freight-movements/actions";
import { FreightMovementDetailView } from "@/components/freight-movements/freight-movement-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const FreightMovementDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const movement = await getFreightMovementDetail(uuid);

  if (!movement) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/freight-movements"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Freight Movement
        </Link>
      </div>
      <PageHeading title={`Movement #${movement.id}`} />
      <FreightMovementDetailView movement={movement} />
    </div>
  );
};

export default FreightMovementDetailPage;
