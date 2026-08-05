import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getChargeDetail } from "@/app/(dashboard)/charges/actions";
import { ChargeDetailView } from "@/components/charges/charge-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ChargeDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const charge = await getChargeDetail(uuid);

  if (!charge) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/charges"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Charges
        </Link>
      </div>
      <PageHeading
        title={charge.surcharge ?? charge.code ?? `Charge #${charge.id}`}
      />
      <ChargeDetailView charge={charge} />
    </div>
  );
};

export default ChargeDetailPage;
