"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { CompanyRelatedRecords } from "@/app/(dashboard)/companies/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CompanyQuoteOrderLinesPanel } from "@/components/companies/company-quote-order-lines-panel";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
  pluralize,
} from "@/lib/helpers";
import {
  CONTACT_CATEGORY_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
  INVOICE_DOCUMENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PURCHASE_INVOICE_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
} from "@/lib/labels";

type Props = {
  records: CompanyRelatedRecords;
};

type DocumentLinkProps = {
  href: string;
  children: ReactNode;
};

// Order and quote statuses that still need something done.
const CLOSED_STATUSES = new Set(["invoiced", "completed", "cancelled", "expired"]);

const sum = (values: Array<string | null>) =>
  values.reduce((total, value) => total + Number(value ?? 0), 0);

const DocumentLink = ({ href, children }: DocumentLinkProps) => (
  <Link href={href} className="font-medium text-primary hover:underline">
    {children}
  </Link>
);

/**
 * The document panels the reference stacks under a company. Each closed bar
 * states what is inside, as the reference's do — `3 open purchase order(s);
 * € 14.115,48; 4808,2 Kg` — so the relationship reads without opening any.
 */
export const CompanyRelatedPanels = ({ records }: Props) => {
  const openOrders = records.orders.filter(
    (order) => !CLOSED_STATUSES.has(order.status),
  );
  const lastOrder = records.orders[0];
  const openQuotes = records.quotes.filter(
    (quote) => !CLOSED_STATUSES.has(quote.status),
  );

  return (
    <div className="space-y-3">
      <CollapsibleSection
        title="Contacts"
        summary={pluralize(records.contacts.length, "contact")}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telephone</TableHead>
              <TableHead>Mobile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.contacts.map((contact) => (
              <TableRow key={contact.uuid}>
                <TableCell>
                  <DocumentLink href={`/contacts/${contact.uuid}`}>
                    {[contact.firstName, contact.lastName]
                      .filter(Boolean)
                      .join(" ") || "View contact"}
                  </DocumentLink>
                </TableCell>
                <TableCell>
                  {(contact.categories ?? [])
                    .map((category) => CONTACT_CATEGORY_LABELS[category])
                    .join(", ") || "—"}
                </TableCell>
                <TableCell>{orDash(contact.email)}</TableCell>
                <TableCell>{orDash(contact.telephone)}</TableCell>
                <TableCell>{orDash(contact.mobile)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CollapsibleSection
        title="Quotes"
        summary={`${openQuotes.length} open; ${formatMoney(sum(openQuotes.map((quote) => quote.totalExclVat)))}`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote no</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quote date</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead className="text-right">Amount (excl. VAT)</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead>Customer reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.quotes.map((quote) => (
              <TableRow key={quote.uuid}>
                <TableCell>
                  <DocumentLink href={`/quotes/${quote.uuid}`}>
                    {quote.id}
                  </DocumentLink>
                </TableCell>
                <TableCell>{ORDER_STATUS_LABELS[quote.status]}</TableCell>
                <TableCell>{formatDateColumn(quote.quoteDate)}</TableCell>
                <TableCell>{formatDateColumn(quote.validUntil)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(quote.totalExclVat ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(quote.totalWeightKg ?? 0))}
                </TableCell>
                <TableCell>{orDash(quote.customerRef)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CollapsibleSection
        title="Orders"
        summary={`${openOrders.length} in progress${
          lastOrder
            ? `; the last one is from ${formatDateColumn(lastOrder.createdAt)}`
            : ""
        }`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order type</TableHead>
              <TableHead>Order no</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order date</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead className="text-right">Amount (excl. VAT)</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead>Customer reference</TableHead>
              <TableHead>Consignment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.orders.map((order) => (
              <TableRow key={order.uuid}>
                <TableCell>{ORDER_TYPE_LABELS[order.orderType]}</TableCell>
                <TableCell>
                  <DocumentLink href={`/orders/${order.uuid}`}>
                    {order.id}
                  </DocumentLink>
                </TableCell>
                <TableCell>{order.handlingBlocked ? "Yes" : "No"}</TableCell>
                <TableCell>{ORDER_STATUS_LABELS[order.status]}</TableCell>
                <TableCell>{formatDateColumn(order.createdAt)}</TableCell>
                <TableCell>{formatDateColumn(order.deliveryDate)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(order.totalExclVat ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(order.totalWeightKg ?? 0))}
                </TableCell>
                <TableCell>{orDash(order.customerRef)}</TableCell>
                <TableCell>{order.isConsignment ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CompanyQuoteOrderLinesPanel lines={records.quoteAndOrderLines} />

      <CollapsibleSection
        title="Contracts"
        summary={pluralize(records.contracts.length, "contract")}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Starting date</TableHead>
              <TableHead>End date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.contracts.map((contract) => (
              <TableRow key={contract.uuid}>
                <TableCell>
                  <DocumentLink href={`/contracts/${contract.uuid}`}>
                    {contract.code}
                  </DocumentLink>
                </TableCell>
                <TableCell>{contract.description}</TableCell>
                <TableCell>
                  {contract.contractType
                    ? CONTRACT_TYPE_LABELS[contract.contractType]
                    : "—"}
                </TableCell>
                <TableCell>
                  {contract.role ? CONTRACTABLE_ROLE_LABELS[contract.role] : "—"}
                </TableCell>
                <TableCell>{formatDateColumn(contract.startingDate)}</TableCell>
                <TableCell>{formatDateColumn(contract.endDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CollapsibleSection
        title="Purchase quotes"
        summary={`${pluralize(records.purchaseQuotes.length, "purchase quote")}; ${formatMoney(sum(records.purchaseQuotes.map((quote) => quote.totalExclVat)))}; ${formatNumber(sum(records.purchaseQuotes.map((quote) => quote.totalWeightKg)))} kg`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote no</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quote date</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead className="text-right">Amount (excl. VAT)</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.purchaseQuotes.map((quote) => (
              <TableRow key={quote.uuid}>
                <TableCell>
                  <DocumentLink href={`/purchase-quotes/${quote.uuid}`}>
                    {quote.id}
                  </DocumentLink>
                </TableCell>
                <TableCell>
                  {quote.status ? PURCHASE_QUOTE_STATUS_LABELS[quote.status] : "—"}
                </TableCell>
                <TableCell>{formatDateColumn(quote.quoteDate)}</TableCell>
                <TableCell>{formatDateColumn(quote.validUntil)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(quote.totalExclVat ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(quote.totalWeightKg ?? 0))}
                </TableCell>
                <TableCell>{orDash(quote.reference)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CollapsibleSection
        title="Purchase invoices"
        summary={`${pluralize(records.purchaseInvoices.length, "purchase invoice")}; ${formatMoney(sum(records.purchaseInvoices.map((invoice) => invoice.outstanding)))} outstanding`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Supplier invoice no</TableHead>
              <TableHead>Invoice date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Invoice total</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.purchaseInvoices.map((invoice) => (
              <TableRow key={invoice.uuid}>
                <TableCell>
                  <DocumentLink href={`/purchase-invoices/${invoice.uuid}`}>
                    {invoice.id}
                  </DocumentLink>
                </TableCell>
                <TableCell>
                  {invoice.documentType
                    ? INVOICE_DOCUMENT_TYPE_LABELS[invoice.documentType]
                    : "—"}
                </TableCell>
                <TableCell>{orDash(invoice.invoiceNumberSupplier)}</TableCell>
                <TableCell>{formatDateColumn(invoice.invoiceDate)}</TableCell>
                <TableCell>
                  {invoice.status
                    ? PURCHASE_INVOICE_STATUS_LABELS[invoice.status]
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(invoice.invoiceTotal ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(invoice.outstanding ?? 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CollapsibleSection
        title="Purchase returns"
        summary={`${pluralize(records.purchaseReturns.length, "purchase return order")}; ${formatMoney(sum(records.purchaseReturns.map((row) => row.totalExclVat)))}; ${formatNumber(sum(records.purchaseReturns.map((row) => row.totalWeightKg)))} kg`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return no</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Return date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Amount (excl. VAT)</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.purchaseReturns.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell>
                  <DocumentLink href={`/purchase-return-orders/${row.uuid}`}>
                    {row.id}
                  </DocumentLink>
                </TableCell>
                <TableCell>
                  {row.status ? PURCHASE_ORDER_STATUS_LABELS[row.status] : "—"}
                </TableCell>
                <TableCell>{formatDateColumn(row.returnDate)}</TableCell>
                <TableCell>
                  {row.returnReason
                    ? PURCHASE_RETURN_ORDER_REASON_LABELS[row.returnReason]
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(row.totalExclVat ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(row.totalWeightKg ?? 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>

      <CollapsibleSection
        title="Communication"
        summary={pluralize(records.communications.length, "message")}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Failed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.communications.map((message) => (
              <TableRow key={message.uuid}>
                <TableCell>{formatDateColumn(message.sentAt)}</TableCell>
                <TableCell>{orDash(message.documentLabel)}</TableCell>
                <TableCell>{orDash(message.subject)}</TableCell>
                <TableCell>{message.channel}</TableCell>
                <TableCell>{orDash(message.recipient)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {message.deliveredCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {message.failedCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleSection>
    </div>
  );
};
