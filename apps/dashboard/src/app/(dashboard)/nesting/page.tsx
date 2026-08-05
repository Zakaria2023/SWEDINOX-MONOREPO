import { getNesting } from "@/app/(dashboard)/nesting/actions";
import { NestingTable } from "@/components/nesting/nesting-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const NestingPage = async () => {
  const rows = await getNesting();

  return (
    <div className="space-y-4">
      <PageHeading title="Nesting" />
      <NestingTable rows={rows} />
    </div>
  );
};

export default NestingPage;
