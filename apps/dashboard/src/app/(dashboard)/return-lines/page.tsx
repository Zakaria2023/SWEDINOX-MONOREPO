import { getReturnLines } from "@/app/(dashboard)/return-lines/actions";
import { ReturnLinesTable } from "@/components/return-lines/return-lines-table-content";
import { GenerateReturnLinesButton } from "@/components/return-lines/generate-return-lines-button";
import { PageHeading } from "@/components/layout/page-heading";

const ReturnLinesPage = async () => {
  const lines = await getReturnLines();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          title="Return lines"
          description="Return-order line items with pricing, margin and complaint link"
        />
        <GenerateReturnLinesButton />
      </div>
      <ReturnLinesTable lines={lines} />
    </div>
  );
};

export default ReturnLinesPage;
