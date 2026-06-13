import { ChevronLeft } from "lucide-react";
import { getContractGroups } from "@/app/(dashboard)/contracts/actions";
import { ContractForm } from "@/components/contracts/contract-form";
import { PageHeading } from "@/components/layout/page-heading";
import { TranslatedLink } from "@/components/layout/translated-link";

const AddContractPage = async () => {
  const groups = await getContractGroups();

  return (
    <div className="space-y-6 p-6">
      <div>
        <TranslatedLink
          href="/contracts"
          labelKey="contracts-add-page.back-link"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          icon={<ChevronLeft className="size-4" />}
        />
      </div>
      <PageHeading titleKey="contracts-add-page.title" />
      <ContractForm groups={groups} />
    </div>
  );
};

export default AddContractPage;
