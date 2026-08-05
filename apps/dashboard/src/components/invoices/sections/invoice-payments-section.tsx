"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  getInvoicePaymentPreview,
  PaymentPreview,
  registerPayment,
  reversePayment,
} from "@/app/(dashboard)/payments/actions";
import { SelectPayments } from "@/db/schema/payments";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import {
  InvoiceDocumentType,
  PaymentMethod,
  paymentMethods,
} from "@/lib/enums";
import { enumOptions, formatMoney, todayDateString } from "@/lib/helpers";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { Undo2 } from "lucide-react";

const methodOptions = enumOptions(paymentMethods, PAYMENT_METHOD_LABELS);

type Props = {
  invoiceUuid: string;
  outstanding: string;
  cancelled: boolean;
  documentType: InvoiceDocumentType;
  payments: SelectPayments[];
};

export const InvoicePaymentsSection = ({
  invoiceUuid,
  outstanding,
  cancelled,
  documentType,
  payments,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [paymentDate, setPaymentDate] = useState(todayDateString());
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [claimDiscount, setClaimDiscount] = useState(false);
  const [preview, setPreview] = useState<PaymentPreview | null>(null);

  // A credit note's outstanding is negative by design. Left to the plain
  // "settled" test it would report itself paid off, when in fact the money runs
  // the other way and is waiting to offset the customer's next invoice.
  const isCreditNote = documentType === "credit_note";
  const isSettled = !isCreditNote && Number(outstanding) <= 0;

  // What settling on the chosen date would take, including any early-payment
  // discount still open on that date. Responses are stamped so a slow earlier
  // lookup can't overwrite the answer for the date now on screen.
  const latestRequest = useRef(0);

  useEffect(() => {
    latestRequest.current += 1;
    const requestId = latestRequest.current;

    getInvoicePaymentPreview(invoiceUuid, paymentDate).then((result) => {
      if (latestRequest.current === requestId) {
        setPreview(result);
      }
    });
  }, [invoiceUuid, paymentDate]);

  const deductionAvailable = preview?.deductionAvailable ?? 0;
  const suggested = claimDiscount
    ? (preview?.cashDue ?? 0)
    : (preview?.outstanding ?? 0);

  // Two separate entitlements can apply on the same payment, so the offer says
  // which is which rather than showing one unexplained number.
  const deductionParts = [
    (preview?.discountAvailable ?? 0) > 0 &&
      `${formatMoney(preview?.discountAvailable ?? 0)} early-payment discount`,
    (preview?.creditRestrictionAvailable ?? 0) > 0 &&
      `${formatMoney(preview?.creditRestrictionAvailable ?? 0)} credit restriction`,
  ].filter((part): part is string => typeof part === "string");

  const submit = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await registerPayment({
        invoiceUuid,
        paymentDate,
        amount: amount || suggested.toFixed(2),
        method,
        reference: reference || undefined,
        claimDiscount,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setAmount("");
      setReference("");
    });
  };

  const reverse = (paymentUuid: string) => {
    setError(undefined);
    startTransition(async () => {
      const result = await reversePayment(paymentUuid);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        {isCreditNote ? "Credit" : "Payments"}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {isCreditNote
            ? `${formatMoney(Math.abs(Number(outstanding)))} owed to the customer`
            : `${formatMoney(Number(outstanding))} outstanding`}
        </span>
      </h2>

      {error && <FormError>{error}</FormError>}

      {payments.length > 0 && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.uuid}
                  className={payment.reversed ? "text-muted-foreground" : ""}
                >
                  <TableCell>{payment.paymentDate}</TableCell>
                  <TableCell>
                    {payment.method
                      ? PAYMENT_METHOD_LABELS[payment.method]
                      : "—"}
                  </TableCell>
                  <TableCell>{payment.reference ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(payment.amount))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(payment.discountAmount))}
                  </TableCell>
                  <TableCell>
                    {payment.reversed ? (
                      <span className="text-xs">Reversed</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reverse(payment.uuid)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Undo2 className="size-3.5" /> Reverse
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Nothing is received against a credit note, so it is offered no
          payment form — registerPayment would refuse it anyway. */}
      {!cancelled && !isSettled && !isCreditNote && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <FormLabel htmlFor="paymentDate">Payment date</FormLabel>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="paymentAmount">Amount received</FormLabel>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder={suggested.toFixed(2)}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="paymentMethod">Method</FormLabel>
              <Select
                id="paymentMethod"
                value={method}
                options={methodOptions}
                onValueChange={(value) => setMethod(value as PaymentMethod)}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="paymentReference">Reference</FormLabel>
              <Input
                id="paymentReference"
                placeholder="Bank statement line"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* What the term entitles the payer to keep back, offered only while
              the windows are still open on the chosen payment date. */}
          {deductionAvailable > 0 && (
            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-dashed p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-primary"
                checked={claimDiscount}
                onChange={(event) => setClaimDiscount(event.target.checked)}
                disabled={isPending}
              />
              <span>
                Customer kept back{" "}
                <span className="font-medium">
                  {formatMoney(deductionAvailable)}
                </span>{" "}
                ({deductionParts.join(" + ")}). The invoice settles in full for{" "}
                <span className="font-medium">
                  {formatMoney(preview?.cashDue ?? 0)}
                </span>
                .
              </span>
            </label>
          )}

          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending
              ? "Registering..."
              : `Register payment of ${formatMoney(Number(amount) || suggested)}`}
          </Button>
        </div>
      )}

      {isSettled && (
        <p className="text-sm text-muted-foreground">
          This invoice is settled in full.
        </p>
      )}

      {isCreditNote && (
        <p className="text-sm text-muted-foreground">
          A credit note isn&apos;t paid — it reduces what this customer owes.
          The {formatMoney(Math.abs(Number(outstanding)))} here nets off against
          their balance and frees the same amount of credit space.
        </p>
      )}
    </div>
  );
};
