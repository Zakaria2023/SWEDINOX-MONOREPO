import { getCbsDocumentation } from "@/app/(dashboard)/cbs-documentation/actions";
import { CbsDocumentationTable } from "@/components/cbs-documentation/cbs-documentation-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CbsDocumentationPage = async () => {
  const rows = await getCbsDocumentation();

  return (
    <div className="space-y-4">
      <PageHeading title="CBS Documentation" />
      <CbsDocumentationTable rows={rows} />
    </div>
  );
};

export default CbsDocumentationPage;
