import { getVisitReportForEdit } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import { visitReportToFormValues } from "@/app/(dashboard)/visit-reports/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { VisitReportCategoriesEditor } from "@/components/visit-reports/edit/visit-report-categories-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const VisitReportCategoriesPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const report = await getVisitReportForEdit(uuid);

  if (!report) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link
          href={`/visit-reports/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title="Categories" />
      <VisitReportCategoriesEditor
        visitReportUuid={uuid}
        defaultValues={visitReportToFormValues(report)}
      />
    </div>
  );
};

export default VisitReportCategoriesPage;
