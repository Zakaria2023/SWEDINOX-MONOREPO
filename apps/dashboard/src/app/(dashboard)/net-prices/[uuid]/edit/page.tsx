import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getContractsForSelect } from "@/app/(dashboard)/contracts/actions";
import { getNetPriceDetail } from "@/app/(dashboard)/net-prices/actions";
import { NetPriceForm } from "@/components/net-prices/net-price-form";
import { toDateInput } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditNetPricePage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const netPrice = await getNetPriceDetail(uuid);

  if (!netPrice) {
    notFound();
  }

  const contracts = await getContractsForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/net-prices/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to net price
        </Link>
      </div>
      <NetPriceForm
        contracts={contracts}
        netPriceUuid={uuid}
        defaultValues={{
          contractUuid: netPrice.contractUuid,
          productUuid: netPrice.productUuid,
          netPrice: netPrice.netPrice ?? "",
          netPriceUnit: netPrice.netPriceUnit ?? "KG",
          fromQty: netPrice.fromQty ?? "0",
          fromQtyUnit: netPrice.fromQtyUnit ?? "KG",
          validFrom: toDateInput(netPrice.validFrom),
          validUntil: toDateInput(netPrice.validUntil),
        }}
      />
    </div>
  );
};

export default EditNetPricePage;
