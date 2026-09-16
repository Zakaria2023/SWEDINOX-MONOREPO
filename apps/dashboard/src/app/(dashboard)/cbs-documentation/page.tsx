import { getCbsDocumentation } from "@/app/(dashboard)/cbs-documentation/actions";
import { CbsDocumentationTable } from "@/components/cbs-documentation/cbs-documentation-table-content";

const CbsDocumentationPage = async () => {
  const rows = await getCbsDocumentation();

  return (
    <div className="space-y-4">
      <CbsDocumentationTable rows={rows} />
    </div>
  );
};

export default CbsDocumentationPage;
