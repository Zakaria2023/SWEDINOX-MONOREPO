import { getRemarksPerCompany } from "@/app/(dashboard)/remarks-per-company/actions";
import { RemarksPerCompanyTable } from "@/components/remarks-per-company/remarks-per-company-table-content";

const RemarksPerCompanyPage = async () => {
  const rows = await getRemarksPerCompany();

  return (
    <div className="space-y-4">
      <RemarksPerCompanyTable rows={rows} />
    </div>
  );
};

export default RemarksPerCompanyPage;
