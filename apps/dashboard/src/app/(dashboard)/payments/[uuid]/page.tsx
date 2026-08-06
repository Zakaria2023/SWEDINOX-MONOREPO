import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPaymentDetail } from "@/app/(dashboard)/payments/actions";
import { PaymentDetailView } from "@/components/payments/payment-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatMoney } from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PaymentDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const payment = await getPaymentDetail(uuid);

  if (!payment) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Payments
        </Link>
      </div>
      <PageHeading title={formatMoney(Number(payment.amount))} />
      <PaymentDetailView payment={payment}  userNames={userNames} />
    </div>
  );
};

export default PaymentDetailPage;
