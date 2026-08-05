import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getBatchDetail } from "@/app/(dashboard)/batches/actions";
import { BatchDetailView } from "@/components/batches/batch-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const BatchDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const batch = await getBatchDetail(uuid);

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/batches"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Batches
        </Link>
      </div>
      <PageHeading title={batch.internalCharge ?? `Batch #${batch.id}`} />
      <BatchDetailView batch={batch} />
    </div>
  );
};

export default BatchDetailPage;
