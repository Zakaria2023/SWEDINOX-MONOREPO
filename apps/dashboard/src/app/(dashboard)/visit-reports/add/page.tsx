import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCustomerAndProspectCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkAdminUsers } from "@/lib/server/clerk";
import { VisitReportForm } from "@/components/visit-reports/visit-report-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddVisitReportPage = async () => {
  const [companies, adminUsers] = await Promise.all([
    getCustomerAndProspectCompaniesForSelect(),
    getClerkAdminUsers(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/visit-reports"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Visit Reports
        </Link>
      </div>
      <PageHeading title="New Visit Report" />
      <VisitReportForm companies={companies} adminUsers={adminUsers} />
    </div>
  );
};

export default AddVisitReportPage;
