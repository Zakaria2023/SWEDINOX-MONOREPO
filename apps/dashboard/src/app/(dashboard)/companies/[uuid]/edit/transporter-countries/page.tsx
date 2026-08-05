import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyTransporterCountriesEditor } from "@/components/companies/edit/company-transporter-countries-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransporterCountriesForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyTransporterCountriesPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, transporterCountries] = await Promise.all([
    getCompanyHeader(uuid),
    getTransporterCountriesForCompany(uuid),
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
      <PageHeading title={`Transporter Countries — ${company.companyName}`} />
      <CompanyTransporterCountriesEditor
        companyUuid={uuid}
        transporterCountries={transporterCountries}
      />
    </div>
  );
};

export default CompanyTransporterCountriesPage;
