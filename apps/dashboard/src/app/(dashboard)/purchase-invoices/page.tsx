import Link from "next/link";
import { Plus } from "lucide-react";
import { getPurchaseInvoices } from "@/app/(dashboard)/purchase-invoices/actions";
import { PageHeading } from "@/components/layout/page-heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
} from "@/lib/labels";

const PurchaseInvoicesPage = async () => {
  const invoices = await getPurchaseInvoices();
  const na = COMMON_TEXT.notAvailable;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeading title="Purchase Invoices" />
        <Link
          href="/purchase-invoices/add"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Purchase Invoice
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Sent By</TableHead>
              <TableHead>Supplier Code</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Exp. Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead>Block Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No purchase invoices yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.uuid}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {inv.id}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.companyName ?? na}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {[inv.contactFirstName, inv.contactLastName]
                      .filter(Boolean)
                      .join(" ") || na}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.supplierCode ?? na}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.invoiceDate?.toLocaleDateString() ?? na}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.expirationDate?.toLocaleDateString() ?? na}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    € {inv.invoiceTotal}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.paymentTerms
                      ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms]
                      : na}
                  </TableCell>
                  <TableCell>
                    {inv.blocked ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.blockReason
                      ? PURCHASE_INVOICE_BLOCK_REASON_LABELS[inv.blockReason]
                      : na}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchaseInvoicesPage;
