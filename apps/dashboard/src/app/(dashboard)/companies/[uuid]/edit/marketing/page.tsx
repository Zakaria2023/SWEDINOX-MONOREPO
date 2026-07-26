import { getIndustriesForSelect } from "@/app/(dashboard)/industries/actions";
import { CompanyMarketingForm } from "@/components/companies/edit/company-marketing-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyMarketing } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyMarketingPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, industries] = await Promise.all([
    getCompanyMarketing(uuid),
    getIndustriesForSelect(),
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
        title={`Marketing — ${company.companyName}`}
        description="Industry, classification, visit planning, and revenue targets"
      />
      <CompanyMarketingForm company={company} industries={industries} />
    </div>
  );
};

export default CompanyMarketingPage;
