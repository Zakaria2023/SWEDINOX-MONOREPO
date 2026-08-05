import { CompanyRolesForm } from "@/components/companies/edit/company-roles-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyRoles } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyRolesPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const company = await getCompanyRoles(uuid);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Roles — ${company.companyName}`} />
      <CompanyRolesForm company={company} />
    </div>
  );
};

export default CompanyRolesPage;
