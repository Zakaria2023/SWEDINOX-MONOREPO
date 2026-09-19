import Link from "next/link";
import { OrderInvoiceLineRow } from "@/app/(dashboard)/orders/[uuid]/actions";
import { OrderDetail } from "@/app/(dashboard)/orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateColumn, formatMoney, pluralize, yesNo } from "@/lib/helpers";
import {
  DISCOUNT_UNIT_LABELS,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type InvoiceLinesProps = {
  rows: OrderInvoiceLineRow[];
};

type FinancesProps = {
  order: OrderDetail;
};

const formatTimestamp = (value: Date | null): string =>
  value === null ? "—" : new Date(value).toLocaleString("en-GB");

/**
 * `Invoice lines` — where the certificate chain ends up.
 *
 * Three things this panel settles, all captured on order `100742`:
 *
 *  - **One order, several invoices.** Lines are billed as they ship, so `100742`
 *    produced `500509` in February and `501106` in March.
 *  - **`Charge`, `Purchase order` and `Receipt date` are on the line.** The heat
 *    traces mill → goods-in → pick → lorry → invoice, so "which melt was on
 *    invoice 501106 line 70" is answerable from here.
 *  - **Sending is recorded per line**, with its own timestamp and address, not
 *    once per invoice.
 *
 * `PriceQty` is the tonnage billed and `Amount = PriceQty × Gross price` held to
 * the cent on all four captured rows.
 */
export const OrderInvoiceLinesPanel = ({ rows }: InvoiceLinesProps) => (
  <CollapsibleSection
    title="Invoice lines"
    summary={`${rows.length} ${pluralize(rows.length, "line")}`}
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Line</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Price qty</TableHead>
          <TableHead>Per</TableHead>
          <TableHead className="text-right">Gross price</TableHead>
          <TableHead className="text-right">Line disc.</TableHead>
          <TableHead>RdU</TableHead>
          <TableHead className="text-right">Group disc.</TableHead>
          <TableHead>GdU</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Printed</TableHead>
          <TableHead>Print date</TableHead>
          <TableHead>Mailed</TableHead>
          <TableHead>E-mail date</TableHead>
          <TableHead>E-mail address</TableHead>
          <TableHead>Charge</TableHead>
          <TableHead>Purchase order</TableHead>
          <TableHead>Receipt date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={23}
              className="h-16 text-center text-muted-foreground"
            >
              Nothing on this order has been invoiced yet.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                {row.orderLineNumber ?? row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>
                {row.invoiceUuid && row.invoiceNumber !== null ? (
                  <Link
                    href={`/invoices/${row.invoiceUuid}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {row.invoiceNumber}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{INVOICE_LINE_TYPE_LABELS[row.type]}</TableCell>
              <TableCell>{formatDateColumn(row.deliveryDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.quantity}
              </TableCell>
              <TableCell>
                {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
              </TableCell>
              <TableCell>
                {row.description ??
                  [row.productCode, row.productName]
                    .filter(Boolean)
                    .join(" — ") ??
                  "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.priceQty ?? "—"}
              </TableCell>
              <TableCell>{row.priceUnit ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(row.grossPrice ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.lineDiscount ?? "—"}
              </TableCell>
              <TableCell>
                {DISCOUNT_UNIT_LABELS[row.lineDiscountUnit]}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.groupDiscount ?? "—"}
              </TableCell>
              <TableCell>
                {DISCOUNT_UNIT_LABELS[row.groupDiscountUnit]}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(row.amount ?? 0))}
              </TableCell>
              <TableCell>{yesNo(row.printed)}</TableCell>
              <TableCell>{formatTimestamp(row.printedAt)}</TableCell>
              <TableCell>{yesNo(row.mailed)}</TableCell>
              <TableCell>{formatTimestamp(row.mailedAt)}</TableCell>
              <TableCell>{row.mailedTo ?? "—"}</TableCell>
              <TableCell>{row.charge ?? "—"}</TableCell>
              <TableCell>{row.purchaseOrderNumber ?? "—"}</TableCell>
              <TableCell>{formatDateColumn(row.receiptDate)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </CollapsibleSection>
);

/**
 * `Finances` — the payment terms and the switches that shape the invoice.
 *
 * Every control on the captured panel already had a column here, including the
 * two blockages sharing one reason. This renders what was already modelled
 * rather than adding to it.
 */
export const OrderFinancesPanel = ({ order }: FinancesProps) => (
  <CollapsibleSection
    title="Finances"
    summary={
      order.financialBlockage || order.invoiceBlockage
        ? "Blocked"
        : order.paymentTerms
          ? INVOICE_PAYMENT_TERM_LABELS[order.paymentTerms]
          : "No payment terms set"
    }
  >
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <DetailField
        label="Payment terms"
        value={
          order.paymentTerms
            ? INVOICE_PAYMENT_TERM_LABELS[order.paymentTerms]
            : null
        }
      />
      <DetailField label="Blocking reason" value={order.blockingReason} />
      <DetailField
        label="Financial blockage"
        value={yesNo(order.financialBlockage)}
      />
      <DetailField
        label="Invoice blockage"
        value={yesNo(order.invoiceBlockage)}
      />
      <DetailField label="Show net price" value={yesNo(order.showNetPrice)} />
      <DetailField
        label="Scrap surcharge separately"
        value={yesNo(order.scrapSurchargeSeparate)}
      />
      <DetailField
        label="Calculate VAT if applicable"
        value={yesNo(order.calculateVatIfApplicable)}
      />
      <DetailField
        label="Only total amount on invoice"
        value={yesNo(order.onlyTotalAmountOnInvoice)}
      />
      <DetailField
        label="Include option prices in material prices"
        value={yesNo(order.includeOptionPricesInMaterialPrices)}
      />
    </div>
  </CollapsibleSection>
);
