import { getNesting } from "@/app/(dashboard)/nesting/actions";
import { NestingTable } from "@/components/nesting/nesting-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const NestingPage = async () => {
  const rows = await getNesting();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Nesting"
        description="Sheet-metal nesting plan per order line — dimensions, the sawing/nesting plan, the delivery plan and the material fetched from stock"
      />
      <NestingTable rows={rows} />
    </div>
  );
};

export default NestingPage;
