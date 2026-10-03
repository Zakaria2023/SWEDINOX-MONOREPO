import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getComplaintDetail,
  getComplaintOrderLines,
} from "@/app/(dashboard)/complaints/actions";
import { ComplaintDetailView } from "@/components/complaints/complaint-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ComplaintDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const complaint = await getComplaintDetail(uuid);

  if (!complaint) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names. Sequential rather
  // than concurrent: this database caps connections.
  const userNames = await getClerkUserNames();
  const orderLines = await getComplaintOrderLines(uuid);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Complaints
        </Link>
      </div>
      <PageHeading title={`Complaint #${complaint.id}`} />
      <ComplaintDetailView
        complaint={complaint}
        userNames={userNames}
        orderLines={orderLines}
      />
    </div>
  );
};

export default ComplaintDetailPage;
