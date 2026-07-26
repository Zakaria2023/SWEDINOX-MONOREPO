import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyTransporterCostsEditor } from "@/components/companies/edit/company-transporter-costs-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransporterCostsForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyTransporterCostsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, transporterCosts] = await Promise.all([
    getCompanyHeader(uuid),
    getTransporterCostsForCompany(uuid),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading
        title={`Transporter Costs — ${company.companyName}`}
        description="Transport price agreements per validity window and KM/KG range. Save each row after editing it."
      />
      <CompanyTransporterCostsEditor
        companyUuid={uuid}
        transporterCosts={transporterCosts}
      />
    </div>
  );
};

export default CompanyTransporterCostsPage;
