import { getVisitsMade } from "@/app/(dashboard)/visits-made/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { VisitsMadeTable } from "@/components/visits-made/visits-made-table-content";

const VisitsMadePage = async () => {
  const rows = await getVisitsMade();

  return (
    <div className="space-y-4">
      <PageHeading title="Visits made" />
      <VisitsMadeTable rows={rows} />
    </div>
  );
};

export default VisitsMadePage;
