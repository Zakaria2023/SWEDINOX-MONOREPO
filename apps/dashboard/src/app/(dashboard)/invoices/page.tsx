import Link from "next/link";
import { Plus } from "lucide-react";
import { getInvoices } from "@/app/(dashboard)/invoices/actions";
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
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";

const InvoicesPage = async () => {
  const invoices = await getInvoices();
  const na = COMMON_TEXT.notAvailable;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeading title="Invoices" />
        <Link
          href="/invoices/add"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Invoice
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Customer Code</TableHead>
              <TableHead>Debtor No</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead className="text-right">Excl. VAT</TableHead>
              <TableHead className="text-right">Incl. VAT</TableHead>
              <TableHead className="text-right">Credit Restriction</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>VAT Scenario</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No invoices yet.
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
                    {inv.companyCode ?? na}
                  </TableCell>
                  <TableCell>{inv.debtorNo ?? na}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.invoiceDate ?? na}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.expirationDate ?? na}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    € {inv.invoiceAmountExclVat}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    € {inv.invoiceAmountInclVat}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    € {inv.creditRestriction}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    € {inv.invoiceTotal}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    € {inv.outstanding}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.vatScenario
                      ? INVOICE_VAT_SCENARIO_LABELS[inv.vatScenario]
                      : na}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.paymentTerms
                      ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms]
                      : na}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {inv.calculateVat && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          VAT
                        </span>
                      )}
                      {inv.printed && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Printed
                        </span>
                      )}
                      {inv.mailed && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Mailed
                        </span>
                      )}
                      {!inv.calculateVat && !inv.printed && !inv.mailed && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
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

export default InvoicesPage;
