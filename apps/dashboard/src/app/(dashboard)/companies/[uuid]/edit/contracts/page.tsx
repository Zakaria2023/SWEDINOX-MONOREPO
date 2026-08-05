import { getContracts } from "@/app/(dashboard)/contracts/actions";
import { CompanyContractsEditor } from "@/components/companies/edit/company-contracts-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyHeader } from "../contacts/actions";
import { getCompanyContractableRoles, getContractsForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyContractsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, contracts, availableContracts, activeContractableRoles] =
    await Promise.all([
      getCompanyHeader(uuid),
      getContractsForCompany(uuid),
      getContracts(),
      getCompanyContractableRoles(uuid),
    ]);

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
      <PageHeading title={`Contracts — ${company.companyName}`} />
      <CompanyContractsEditor
        companyUuid={uuid}
        contracts={contracts}
        availableContracts={availableContracts}
        activeContractableRoles={activeContractableRoles}
      />
    </div>
  );
};

export default CompanyContractsPage;
