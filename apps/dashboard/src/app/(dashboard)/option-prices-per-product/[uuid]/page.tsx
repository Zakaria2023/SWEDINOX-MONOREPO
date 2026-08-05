import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOptionPriceDetail } from "@/app/(dashboard)/option-prices-per-product/actions";
import { OptionPriceDetailView } from "@/components/option-prices-per-product/option-price-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const OptionPriceDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const optionPrice = await getOptionPriceDetail(uuid);

  if (!optionPrice) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/option-prices-per-product"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Option Prices per Product
        </Link>
      </div>
      <PageHeading
        title={
          [optionPrice.productCode, optionPrice.optionCode]
            .filter(Boolean)
            .join(" — ") || `Option price #${optionPrice.id}`
        }
      />
      <OptionPriceDetailView optionPrice={optionPrice} />
    </div>
  );
};

export default OptionPriceDetailPage;
