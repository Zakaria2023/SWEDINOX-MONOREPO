import { getCbsDocumentation } from "@/app/(dashboard)/cbs-documentation/actions";
import { CbsDocumentationTable } from "@/components/cbs-documentation/cbs-documentation-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CbsDocumentationPage = async () => {
  const rows = await getCbsDocumentation();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="CBS Documentation"
        description="CBS / Intrastat export base — one row per invoiced goods line with its customer and originating order"
      />
      <CbsDocumentationTable rows={rows} />
    </div>
  );
};

export default CbsDocumentationPage;
