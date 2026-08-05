import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractGroups } from "@/app/(dashboard)/contract-groups/actions";
import { getContractDetail } from "@/app/(dashboard)/contracts/actions";
import { contractDetailToFormValues } from "@/app/(dashboard)/contracts/mappers";
import { ContractForm } from "@/components/contracts/contract-form";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditContractPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [contract, groups, companies] = await Promise.all([
    getContractDetail(uuid),
    getContractGroups(),
    getCompaniesForSelect(),
  ]);

  if (!contract) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/contracts/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {contract.code}
        </Link>
      </div>
      <PageHeading title={`Edit ${contract.code}`} />
      <ContractForm
        groups={groups}
        availableCompanies={companies}
        contractUuid={uuid}
        defaultValues={contractDetailToFormValues(contract)}
      />
    </div>
  );
};

export default EditContractPage;
