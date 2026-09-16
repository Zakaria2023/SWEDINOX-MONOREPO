import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getBatchDetail } from "@/app/(dashboard)/batches/actions";
import { PrintLabelButton } from "@/components/batches/print-label-button";
import { StockLabel } from "@/components/batches/stock-label";

type Props = {
  params: Promise<{ uuid: string }>;
};

const BatchLabelPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const batch = await getBatchDetail(uuid);

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/batches"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Batches
        </Link>
        <PrintLabelButton />
      </div>
      <StockLabel batch={batch} />
    </div>
  );
};

export default BatchLabelPage;
