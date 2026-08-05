import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getReoptimizeDetail } from "@/app/(dashboard)/reoptimize/actions";
import { ReoptimizeDetailView } from "@/components/reoptimize/reoptimize-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ReoptimizeDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const row = await getReoptimizeDetail(uuid);

  if (!row) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/reoptimize"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          (Re)optimize
        </Link>
      </div>
      <PageHeading
        title={
          row.orderId === null
            ? `Row #${row.id}`
            : `Order #${row.orderId} — line ${row.lineNumber ?? "?"}`
        }
      />
      <ReoptimizeDetailView row={row} />
    </div>
  );
};

export default ReoptimizeDetailPage;
