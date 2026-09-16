import { getNesting } from "@/app/(dashboard)/nesting/actions";
import { NestingTable } from "@/components/nesting/nesting-table-content";

const NestingPage = async () => {
  const rows = await getNesting();

  return (
    <div className="space-y-4">
      <NestingTable rows={rows} />
    </div>
  );
};

export default NestingPage;
