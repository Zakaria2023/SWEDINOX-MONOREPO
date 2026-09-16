import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getContractsForSelect } from "@/app/(dashboard)/contracts/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { NetPriceForm } from "@/components/net-prices/net-price-form";

const NewNetPricePage = async () => {
  // Sequential rather than concurrent: this database caps connections.
  const contracts = await getContractsForSelect();
  const products = await getProductsForSelect();

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
      <PageHeading title="New net price" />
      <NetPriceForm contracts={contracts} products={products} />
    </div>
  );
};

export default NewNetPricePage;
