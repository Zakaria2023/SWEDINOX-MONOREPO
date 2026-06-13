import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompaniesForSelect, getContractGroups } from "@/app/(dashboard)/contracts/actions";
import { ContractForm } from "@/components/contracts/contract-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddContractPage = async () => {
  const [groups, companies] = await Promise.all([
    getContractGroups(),
    getCompaniesForSelect(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Contracts
        </Link>
      </div>
      <PageHeading title="New Contract" />
      <ContractForm groups={groups} companies={companies} />
    </div>
  );
};

export default AddContractPage;
