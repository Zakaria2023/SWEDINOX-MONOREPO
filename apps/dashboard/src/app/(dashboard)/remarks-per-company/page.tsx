import { getRemarksPerCompany } from "@/app/(dashboard)/remarks-per-company/actions";
import { RemarksPerCompanyTable } from "@/components/remarks-per-company/remarks-per-company-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const RemarksPerCompanyPage = async () => {
  const rows = await getRemarksPerCompany();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Remarks per company"
        description="Companies that carry a free-text remark, with representative and city"
      />
      <RemarksPerCompanyTable rows={rows} />
    </div>
  );
};

export default RemarksPerCompanyPage;
