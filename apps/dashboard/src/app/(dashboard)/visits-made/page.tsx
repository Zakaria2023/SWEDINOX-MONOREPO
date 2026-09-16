import { getVisitsMade } from "@/app/(dashboard)/visits-made/actions";
import { VisitsMadeTable } from "@/components/visits-made/visits-made-table-content";

const VisitsMadePage = async () => {
  const rows = await getVisitsMade();

  return (
    <div className="space-y-4">
      <VisitsMadeTable rows={rows} />
    </div>
  );
};

export default VisitsMadePage;
