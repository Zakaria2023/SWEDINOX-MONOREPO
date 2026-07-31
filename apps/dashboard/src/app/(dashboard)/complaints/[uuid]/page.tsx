import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getComplaintDetail } from "@/app/(dashboard)/complaints/actions";
import { ComplaintDetailView } from "@/components/complaints/complaint-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ComplaintDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const complaint = await getComplaintDetail(uuid);

  if (!complaint) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Complaints
        </Link>
      </div>
      <PageHeading
        title={`Complaint #${complaint.id}`}
        description={complaint.companyName ?? undefined}
      />
      <ComplaintDetailView complaint={complaint} />
    </div>
  );
};

export default ComplaintDetailPage;
