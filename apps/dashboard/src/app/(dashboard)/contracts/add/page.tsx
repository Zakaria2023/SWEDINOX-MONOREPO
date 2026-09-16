import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getContractGroups } from "@/app/(dashboard)/contract-groups/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { ContractForm } from "@/components/contracts/contract-form";

const AddContractPage = async () => {
  const [groups, companies] = await Promise.all([
    getContractGroups(),
    getCompaniesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Contracts
        </Link>
      </div>
      <ContractForm groups={groups} availableCompanies={companies} />
    </div>
  );
};

export default AddContractPage;
