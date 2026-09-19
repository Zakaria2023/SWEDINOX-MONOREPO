import { getRemarksPerCompany } from "@/app/(dashboard)/remarks-per-company/actions";
import { REMARK_PER_COMPANY_FILTER_CONTROLS } from "@/app/(dashboard)/remarks-per-company/filters";
import { RemarksPerCompanyTable } from "@/components/remarks-per-company/remarks-per-company-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const RemarksPerCompanyPage = async ({ searchParams }: Props) => {
  const page = await getRemarksPerCompany(parseTableQuery(await searchParams));

  return (
    <div className="space-y-4">
      <RemarksPerCompanyTable
        page={page}
        filters={REMARK_PER_COMPANY_FILTER_CONTROLS}
      />
    </div>
  );
};

export default RemarksPerCompanyPage;
