import Link from "next/link";
import { InvoiceLineDetail } from "@/app/(dashboard)/invoice-lines/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatPercent,
  invoiceReference,
} from "@/lib/helpers";

type Props = {
  line: InvoiceLineDetail;
};

export const InvoiceLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Invoice</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice
          </p>
          <Link
            href={`/invoices/${line.invoiceUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {invoiceReference(line.invoiceDocumentType, line.invoiceId)}
          </Link>
        </div>
        <DetailField
          label="Invoice date"
          value={formatDateColumn(line.invoiceDate)}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          {line.companyUuid && line.customerName ? (
            <Link
              href={`/companies/${line.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.customerName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="VAT number" value={line.vatNumber} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order line
          </p>
          <Link
            href={`/order-lines/${line.orderItemUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {line.lineNumber === null ? "View line" : `Line ${line.lineNumber}`}
          </Link>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          <Link
            href={`/products/${line.productUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {[line.productCode, line.productName].filter(Boolean).join(" — ") ||
              line.productUuid}
          </Link>
        </div>
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">What was billed</h2>
      <p className="text-sm text-muted-foreground">
        Price, cost and weight are the invoice line&rsquo;s own snapshot, taken
        at invoicing — re-pricing the order or revaluing its lot afterwards does
        not move them.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Quantity" value={line.quantity} />
        <DetailField label="Weight (kg)" value={line.weightKg} />
        <DetailField
          label="Net price"
          value={formatMoney(Number(line.netPrice ?? 0))}
        />
        <DetailField
          label="Amount"
          value={formatMoney(Number(line.amount ?? 0))}
        />
        <DetailField
          label="Cost price"
          value={formatMoney(Number(line.costPrice ?? 0))}
        />
        <DetailField
          label="Cost amount"
          value={formatMoney(Number(line.costAmount ?? 0))}
        />
        <DetailField
          label="Replacement price"
          value={formatMoney(Number(line.replacementPrice ?? 0))}
        />
        <DetailField
          label="Profit"
          value={formatMoney(Number(line.profit ?? 0))}
        />
        <DetailField
          label="Profit margin"
          value={formatPercent(Number(line.profitMargin ?? 0))}
        />
        <DetailField
          label="Profit at replacement price"
          value={formatMoney(Number(line.profitReplPrice ?? 0))}
        />
      </div>
    </section>
  </div>
);
