import { CompanyDetailsForm } from "@/components/companies/edit/company-details-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyDetails } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyDetailsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const company = await getCompanyDetails(uuid);

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
      <PageHeading title={`Company Details — ${company.companyName}`} />
      <CompanyDetailsForm company={company} />
    </div>
  );
};

export default CompanyDetailsPage;
