import { getReturnLines } from "@/app/(dashboard)/return-lines/actions";
import { ReturnLinesTable } from "@/components/return-lines/return-lines-table-content";
import { GenerateReturnLinesButton } from "@/components/return-lines/generate-return-lines-button";

const ReturnLinesPage = async () => {
  const lines = await getReturnLines();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <GenerateReturnLinesButton />
      </div>
      <ReturnLinesTable lines={lines} />
    </div>
  );
};

export default ReturnLinesPage;
