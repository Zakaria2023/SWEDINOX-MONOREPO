import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getComplaintLineDetail } from "@/app/(dashboard)/complaint-lines/actions";
import { ComplaintLineDetailView } from "@/components/complaint-lines/complaint-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ComplaintLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getComplaintLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/complaint-lines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Complaint Lines
        </Link>
      </div>
      <PageHeading
        title={
          line.complaintNumber === null
            ? `Line #${line.id}`
            : `Complaint #${line.complaintNumber} — line ${line.lineNumber ?? "?"}`
        }
      />
      <ComplaintLineDetailView line={line} />
    </div>
  );
};

export default ComplaintLineDetailPage;
