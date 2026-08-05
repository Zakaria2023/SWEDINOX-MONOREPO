import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getReturnLineDetail } from "@/app/(dashboard)/return-lines/actions";
import { ReturnLineDetailView } from "@/components/return-lines/return-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ReturnLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getReturnLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/return-lines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Return Lines
        </Link>
      </div>
      <PageHeading
        title={
          line.returnOrderId === null
            ? `Line #${line.id}`
            : `Return #${line.returnOrderId} — line ${line.lineNumber ?? "?"}`
        }
      />
      <ReturnLineDetailView line={line} />
    </div>
  );
};

export default ReturnLineDetailPage;
