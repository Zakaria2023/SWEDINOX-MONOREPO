import { getComplaintLines } from "@/app/(dashboard)/complaint-lines/actions";
import { ComplaintLinesTable } from "@/components/complaint-lines/complaint-lines-table-content";
import { GenerateComplaintLinesButton } from "@/components/complaint-lines/generate-complaint-lines-button";

const ComplaintLinesPage = async () => {
  const rows = await getComplaintLines();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <GenerateComplaintLinesButton />
      </div>
      <ComplaintLinesTable rows={rows} />
    </div>
  );
};

export default ComplaintLinesPage;
