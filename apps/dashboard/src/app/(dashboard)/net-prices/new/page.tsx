import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getContractsForSelect } from "@/app/(dashboard)/contracts/actions";
import { NetPriceForm } from "@/components/net-prices/net-price-form";

const NewNetPricePage = async () => {
  // Sequential rather than concurrent: this database caps connections.
  const contracts = await getContractsForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/net-prices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Net prices
        </Link>
      </div>
      <NetPriceForm contracts={contracts} />
    </div>
  );
};

export default NewNetPricePage;
