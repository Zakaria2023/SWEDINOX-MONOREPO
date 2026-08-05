import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCustomerAndProspectCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getIndustriesForSelect } from "@/app/(dashboard)/industries/actions";
import { getClerkAdminUsers } from "@/lib/server/clerk";
import { VisitReportForm } from "@/components/visit-reports/visit-report-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddVisitReportPage = async () => {
  const [companies, adminUsers, industries] = await Promise.all([
    getCustomerAndProspectCompaniesForSelect(),
    getClerkAdminUsers(),
    getIndustriesForSelect(),
  ]);

  return (
    <div className="max-w-5xl space-y-6 p-6">
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
      <VisitReportForm
        companies={companies}
        adminUsers={adminUsers}
        industries={industries}
      />
    </div>
  );
};

export default AddVisitReportPage;
