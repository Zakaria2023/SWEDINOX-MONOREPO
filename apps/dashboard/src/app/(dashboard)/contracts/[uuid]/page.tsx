import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractDetail } from "@/app/(dashboard)/contracts/actions";
import { ContractDetailView } from "@/components/contracts/contract-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ContractDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const contract = await getContractDetail(uuid);

  if (!contract) {
    notFound();
  }

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
      <PageHeading title={contract.code} />
      <ContractDetailView contract={contract} />
    </div>
  );
};

export default ContractDetailPage;
