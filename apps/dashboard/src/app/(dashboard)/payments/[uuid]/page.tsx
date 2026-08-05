import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPaymentDetail } from "@/app/(dashboard)/payments/actions";
import { PaymentDetailView } from "@/components/payments/payment-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatDateColumn, formatMoney } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PaymentDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const payment = await getPaymentDetail(uuid);

  if (!payment) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Payments
        </Link>
      </div>
      <PageHeading
        title={formatMoney(Number(payment.amount))}
        description={
          [formatDateColumn(payment.paymentDate), payment.companyName]
            .filter((part) => part && part !== "—")
            .join(" — ") || undefined
        }
      />
      <PaymentDetailView payment={payment} />
    </div>
  );
};

export default PaymentDetailPage;
