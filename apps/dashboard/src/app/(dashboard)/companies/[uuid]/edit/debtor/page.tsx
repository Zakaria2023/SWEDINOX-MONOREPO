import {
  getDebtorCompaniesForSelect,
  getPurchaseOrgCompaniesForSelect,
} from "@/app/(dashboard)/companies/actions";
import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyDebtorForm } from "@/components/companies/edit/company-debtor-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyDebtor } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyDebtorPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, debtor, debtorCompanies, purchaseOrgCompanies] =
    await Promise.all([
      getCompanyHeader(uuid),
      getCompanyDebtor(uuid),
      getDebtorCompaniesForSelect(),
      getPurchaseOrgCompaniesForSelect(),
    ]);

  if (!company || !debtor) {
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
        title={`Debtor & Finance — ${company.companyName}`}
        description="Banking details, credit limits, payment terms, and blocking"
      />
      <CompanyDebtorForm
        company={debtor}
        debtorCompanies={debtorCompanies}
        purchaseOrgCompanies={purchaseOrgCompanies}
      />
    </div>
  );
};

export default CompanyDebtorPage;
