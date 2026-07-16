import { getReturnLines } from "@/app/(dashboard)/return-lines/actions";
import { ReturnLinesTable } from "@/components/return-lines/return-lines-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ReturnLinesPage = async () => {
  const lines = await getReturnLines();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Return lines"
        description="Return-order line items with pricing, margin and complaint link"
      />
      <ReturnLinesTable lines={lines} />
    </div>
  );
};

export default ReturnLinesPage;
