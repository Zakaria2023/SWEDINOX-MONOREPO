import { getIndustriesForSelect } from "@/app/(dashboard)/industries/actions";
import { CompanyMarketingForm } from "@/components/companies/edit/company-marketing-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyCompetitorsEditor } from "@/components/companies/edit/company-competitors-editor";
import { getCompanyCompetitors, getCompanyMarketing } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyMarketingPage = async ({ params }: Props) => {
  const { uuid } = await params;
  // Sequential rather than parallel: the shared MySQL instance caps
  // connections, and three reads on one page do not justify three at once.
  const company = await getCompanyMarketing(uuid);
  const industries = await getIndustriesForSelect();
  const competitors = await getCompanyCompetitors(uuid);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Marketing — ${company.companyName}`} />
      <CompanyMarketingForm company={company} industries={industries} />
      <CompanyCompetitorsEditor companyUuid={uuid} competitors={competitors} />
    </div>
  );
};

export default CompanyMarketingPage;
