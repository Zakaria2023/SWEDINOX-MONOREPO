"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteQuote, QuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { QuoteLinesTable } from "@/components/quotes/quote-lines-table";
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  fullName,
  orDash,
  pluralize,
  quoteSummaryFromSnapshot,
  userName,
  yesNo,
} from "@/lib/helpers";
import {
  CONTRACT_TIER_UNIT_LABELS,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_SURCHARGE_DESCRIPTION_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  quote: QuoteDetail;
};

type FieldProps = {
  label: string;
  value: string | number | null | undefined;
};

const Field = ({ label, value }: FieldProps) => (
  <div>
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <p className="text-sm">{value === "" || value == null ? "—" : value}</p>
  </div>
);

export const QuoteDetailView = ({ quote, userNames }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const summary = quoteSummaryFromSnapshot(quote);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuote(quote.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  // The order type is a set of flags rather than a single field, so the ones
  // that are on are listed and "Normal" stands for none of them being set.
  const orderTypeFlags = [
    quote.isPickup && "Pick-up",
    quote.isIncidental && "Incidental",
    quote.isConsignment && "Consignment",
    quote.isInternalProduction && "Internal production / processing",
    quote.isCustomerMaterial && "Customer material",
    quote.isOverlength && "Overlength",
  ].filter((flag): flag is string => Boolean(flag));

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* ── Quote ───────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Quote</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field
            label="Creation date"
            value={formatDateColumn(quote.createdAt)}
          />
          <Field label="Customer" value={quote.companyName} />
          <Field
            label="Contact"
            value={fullName(quote.contactFirstName, quote.contactLastName)}
          />
          <Field label="Customer ref." value={quote.customerRef} />
          <Field label="Our reference" value={quote.ourReference} />
          <Field
            label="Request"
            value={
              quote.requestMethod
                ? ORDER_METHOD_LABELS[quote.requestMethod]
                : null
            }
          />
          <Field label="Seller" value={userName(quote.seller, userNames)} />
          <Field label="Contract" value={quote.contractCode} />
          <Field label="Price date" value={formatDateColumn(quote.priceDate)} />
          <Field
            label="Decision date"
            value={formatDateColumn(quote.decisionDate)}
          />
          <Field label="Quote date" value={formatDateColumn(quote.quoteDate)} />
          <Field
            label="Validity period"
            value={
              quote.validityPeriodDays != null
                ? pluralize(quote.validityPeriodDays, "calendar day")
                : null
            }
          />
          <Field label="Valid u/i" value={formatDateColumn(quote.validUntil)} />
          <Field
            label="Handling blocked"
            value={yesNo(quote.handlingBlocked)}
          />
        </div>
      </section>

      {/* ── Order type ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Order type</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field
            label="Type"
            value={
              orderTypeFlags.length > 0 ? orderTypeFlags.join(", ") : "Normal"
            }
          />
          <Field
            label="Weight type"
            value={
              quote.weightType
                ? ORDER_WEIGHT_TYPE_LABELS[quote.weightType]
                : null
            }
          />
          {quote.isConsignment && (
            <Field
              label="Consignment duration"
              value={[quote.consignmentDuration, quote.consignmentDurationUnit]
                .filter(Boolean)
                .join(" ")}
            />
          )}
          <Field label="Printed" value={yesNo(quote.isPrinted)} />
          <Field label="Mailed" value={yesNo(quote.isMailed)} />
          <Field label="Faxed" value={yesNo(quote.isFaxed)} />
        </div>
      </section>

      {/* ── Delivery ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Delivery</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field
            label="Delivery terms"
            value={
              quote.deliveryTerms
                ? DELIVERY_TERM_LABELS[quote.deliveryTerms]
                : null
            }
          />
          {quote.deliveryType === "week" ? (
            <Field
              label="Delivery week"
              value={
                quote.deliveryWeek
                  ? `Week ${quote.deliveryWeek} / ${quote.deliveryYear ?? ""}`
                  : null
              }
            />
          ) : (
            <Field
              label="Delivery date"
              value={formatDateColumn(quote.deliveryDate)}
            />
          )}
          <Field label="Rem." value={quote.deliveryRemark} />
        </div>
      </section>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <QuoteSummaryPanel summary={summary} />

      {/* ── Follow-up ───────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Follow-up</h2>
        <Field label="Expired" value={yesNo(quote.expired)} />
      </section>

      {/* ── Quote lines ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b pb-2">
          <h2 className="text-base font-semibold">Quote lines</h2>
          <span className="text-xs text-muted-foreground">
            {pluralize(quote.items.length, "line")}
          </span>
        </div>
        <QuoteLinesTable items={quote.items} />
      </section>

      {/* ── Secondary blocks ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <CollapsibleSection
          title="Contracts"
          summary={quote.contractCode ?? "No contract linked"}
        >
          {quote.contractCode ? (
            <Field label="Contract" value={quote.contractCode} />
          ) : (
            <p className="text-sm text-muted-foreground">
              This quote is not priced against a contract.
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Finances"
          summary={`Payment terms: ${
            quote.paymentTerms
              ? INVOICE_PAYMENT_TERM_LABELS[quote.paymentTerms]
              : "—"
          }`}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Field
              label="Payment terms"
              value={
                quote.paymentTerms
                  ? INVOICE_PAYMENT_TERM_LABELS[quote.paymentTerms]
                  : null
              }
            />
            <Field label="Show net price" value={yesNo(quote.showNetPrice)} />
            <Field
              label="Scrap surcharge separately"
              value={yesNo(quote.scrapSurchargeSeparate)}
            />
            <Field
              label="Calculate VAT if applicable"
              value={yesNo(quote.calculateVatIfApplicable)}
            />
            <Field
              label="Financial blockage"
              value={yesNo(quote.financialBlockage)}
            />
            <Field
              label="Only total amount on invoice"
              value={yesNo(quote.onlyTotalAmountOnInvoice)}
            />
            <Field
              label="Do not show total amount"
              value={yesNo(quote.doNotShowTotalAmount)}
            />
            <Field
              label="Include option prices in material prices"
              value={yesNo(quote.includeOptionPricesInMaterialPrices)}
            />
            <Field label="Blocking reason" value={quote.blockingReason} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Options"
          summary={pluralize(quote.options.length, "option")}
        >
          {quote.options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No options quoted on these lines.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Option</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.options.map((option) => (
                    <TableRow key={option.uuid}>
                      <TableCell className="font-medium">
                        {option.optionCode ?? "—"}
                      </TableCell>
                      <TableCell>{option.optionName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {option.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(option.amount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(option.cost ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(option.profit ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Surcharges"
          summary={pluralize(quote.surcharges.length, "surcharge")}
        >
          {quote.surcharges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No surcharges on this quote.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Surcharge</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">From</TableHead>
                    <TableHead>U/i</TableHead>
                    <TableHead>Tier unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead>Third parties</TableHead>
                    <TableHead>Company code</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.surcharges.map((surcharge) => (
                    <TableRow key={surcharge.uuid}>
                      <TableCell className="font-medium">
                        {surcharge.description
                          ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[
                              surcharge.description
                            ]
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.surcharge ?? 0))}
                      </TableCell>
                      <TableCell>{orDash(surcharge.unit)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(surcharge.fromValue ?? 0))}
                      </TableCell>
                      <TableCell>{orDash(surcharge.unitIndication)}</TableCell>
                      <TableCell>
                        {surcharge.tierUnit
                          ? CONTRACT_TIER_UNIT_LABELS[surcharge.tierUnit]
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.amount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.profit ?? 0))}
                      </TableCell>
                      <TableCell>{yesNo(surcharge.thirdParties)}</TableCell>
                      <TableCell>{orDash(surcharge.companyCode)}</TableCell>
                      <TableCell>{orDash(surcharge.companyName)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(surcharge.order)}
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(surcharge.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Purchase lines"
          summary="Not linked to purchasing yet"
        >
          <p className="text-sm text-muted-foreground">
            Purchase lines are not linked to a quote in this system — a purchase
            order references its supplier and products, not the quote that
            prompted it.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Complaints"
          summary={
            quote.complaints.length === 0
              ? "No complaints"
              : pluralize(quote.complaints.length, "complaint")
          }
        >
          {quote.complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No complaints recorded for this customer.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.complaints.map((complaint) => (
                    <TableRow key={complaint.uuid}>
                      <TableCell>
                        {formatDateColumn(complaint.createdAt)}
                      </TableCell>
                      <TableCell>{complaint.description ?? "—"}</TableCell>
                      <TableCell>{complaint.status ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Follow-up"
          summary={
            quote.followUps.length === 0
              ? "No open follow-ups"
              : pluralize(quote.followUps.length, "open follow-up")
          }
        >
          {quote.followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open follow-ups for this customer.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.followUps.map((followUp) => (
                    <TableRow key={followUp.uuid}>
                      <TableCell>{followUp.date ?? "—"}</TableCell>
                      <TableCell>{followUp.by ?? "—"}</TableCell>
                      <TableCell>{followUp.contactPerson ?? "—"}</TableCell>
                      <TableCell>{followUp.text ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Competitors"
          summary={quote.competitors ? "Recorded" : "None recorded"}
        >
          {quote.competitors ? (
            <p className="text-sm whitespace-pre-wrap">{quote.competitors}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No competitors recorded for this customer.
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Texts"
          summary={quote.remarks ? "Has remarks" : "No texts"}
        >
          {quote.remarks ? (
            <p className="text-sm whitespace-pre-wrap">{quote.remarks}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No texts on this quote.
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Documents"
          summary={pluralize(quote.documents?.length ?? 0, "document")}
        >
          {!quote.documents || quote.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents attached.
            </p>
          ) : (
            <ul className="space-y-2">
              {quote.documents.map((document) => (
                <li key={document.id}>
                  <Link
                    href={`/api/documents/${document.id}/download`}
                    className="text-sm text-primary hover:underline"
                  >
                    {document.fileName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/quotes/${quote.uuid}/edit`} />}
        >
          Edit Quote
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending}
        >
          Delete Quote
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete quote"
        description="This removes the quote and all of its lines. This cannot be undone."
        confirmLabel="Delete Quote"
      />
    </div>
  );
};
