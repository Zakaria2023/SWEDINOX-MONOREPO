import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getVisitReportForEdit } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { visitReportToFormValues } from "@/app/(dashboard)/visit-reports/mappers";
import { VisitReportReportEditor } from "@/components/visit-reports/edit/visit-report-report-editor";
import { getClerkAdminUsers } from "@/lib/server/clerk";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const VisitReportReportPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [report, companies, adminUsers] = await Promise.all([
    getVisitReportForEdit(uuid),
    getCompaniesForSelect(),
    getClerkAdminUsers(),
  ]);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/visit-reports/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <VisitReportReportEditor
        visitReportUuid={uuid}
        defaultValues={visitReportToFormValues(report)}
        companies={companies}
        adminUsers={adminUsers}
      />
    </div>
  );
};

export default VisitReportReportPage;
