import { getComplaintLines } from "@/app/(dashboard)/complaint-lines/actions";
import { ComplaintLinesTable } from "@/components/complaint-lines/complaint-lines-table-content";
import { GenerateComplaintLinesButton } from "@/components/complaint-lines/generate-complaint-lines-button";
import { PageHeading } from "@/components/layout/page-heading";

const ComplaintLinesPage = async () => {
  const rows = await getComplaintLines();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Complaint lines"
          description="What each complaint is actually about, per order line, with its cause, solution and owner"
        />
        <GenerateComplaintLinesButton />
      </div>
      <ComplaintLinesTable rows={rows} />
    </div>
  );
};

export default ComplaintLinesPage;
