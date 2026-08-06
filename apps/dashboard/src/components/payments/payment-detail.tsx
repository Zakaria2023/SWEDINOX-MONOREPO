import Link from "next/link";
import { PaymentDetail } from "@/app/(dashboard)/payments/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  invoiceReference,
  userName,
  yesNo,
} from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  payment: PaymentDetail;
};

export const PaymentDetailView = ({ payment, userNames }: Props) => (
  <div className="space-y-6">
    {payment.reversed && (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        This payment has been reversed
        {payment.reversedAt ? ` on ${formatDateValue(payment.reversedAt)}` : ""}
        . A payment is never edited — a wrong one is reversed and re-registered,
        so the trail keeps what was booked and when.
      </p>
    )}

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Payment</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Payment date"
          value={formatDateColumn(payment.paymentDate)}
        />
        <DetailField
          label="Method"
          value={payment.method ? PAYMENT_METHOD_LABELS[payment.method] : null}
        />
        <DetailField label="Reference" value={payment.reference} />
        <DetailField
          label="Cash amount"
          value={formatMoney(Number(payment.amount))}
        />
        <DetailField
          label="Discount taken"
          value={formatMoney(Number(payment.discountAmount))}
        />
        <DetailField
          label="Total settled"
          value={formatMoney(payment.settledAmount)}
        />
        <DetailField label="Reversed" value={yesNo(payment.reversed)} />
        <DetailField
          label="Registered by"
          value={userName(payment.createdByUserId, userNames)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(payment.createdAt)}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Total settled is the cash plus the early-payment discount the term
        allowed — an invoice can close in full even though less money arrived
        than was billed.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Settled against</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Counterparty
          </p>
          {payment.companyUuid && payment.companyName ? (
            <Link
              href={`/companies/${payment.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {payment.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Sales invoice
          </p>
          {payment.invoiceUuid && payment.invoiceId !== null ? (
            <Link
              href={`/invoices/${payment.invoiceUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {invoiceReference(payment.invoiceDocumentType, payment.invoiceId)}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase invoice
          </p>
          {payment.purchaseInvoiceUuid && payment.purchaseInvoiceId !== null ? (
            <Link
              href={`/purchase-invoices/${payment.purchaseInvoiceUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{payment.purchaseInvoiceId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Invoice date"
          value={formatDateColumn(payment.invoiceDate)}
        />
        <DetailField
          label="Invoice payment term"
          value={
            payment.invoicePaymentTerms
              ? INVOICE_PAYMENT_TERM_LABELS[payment.invoicePaymentTerms]
              : null
          }
        />
        <DetailField
          label="Invoice outstanding now"
          value={
            payment.invoiceOutstanding === null
              ? null
              : formatMoney(Number(payment.invoiceOutstanding))
          }
        />
      </div>
    </section>
  </div>
);
