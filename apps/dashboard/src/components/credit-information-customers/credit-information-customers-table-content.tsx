"use client";

import { CreditInformationRow } from "@/app/(dashboard)/credit-information-customers/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatMoney, invoicePaymentTermLabel, salesRepresentativeLabel } from "@/lib/helpers";

type Props = {
  rows: CreditInformationRow[];
};

export const CreditInformationCustomersTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Customer code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Initials</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Payment terms</TableHead>
          <TableHead className="text-right">Credit limit</TableHead>
          <TableHead className="text-right">Credit limit uninsured</TableHead>
          <TableHead className="text-right">Credit insurance</TableHead>
          <TableHead>Credit insurance date</TableHead>
          <TableHead className="text-right">Outstanding entrees</TableHead>
          <TableHead className="text-right">Current orders</TableHead>
          <TableHead className="text-right">Credit space</TableHead>
          <TableHead>Oldest invoice date</TableHead>
          <TableHead>Oldest due date</TableHead>
          <TableHead className="text-center">Blocked</TableHead>
          <TableHead>VAT number</TableHead>
          <TableHead className="text-right">Revenue this year</TableHead>
          <TableHead className="text-right">Revenue last year</TableHead>
          <TableHead className="text-right">Revenue 2 years ago</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={20}
              className="h-24 text-center text-muted-foreground"
            >
              No customers found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="text-right">{row.customerCode}</TableCell>
              <TableCell className="font-medium">
                {row.companyName ?? "—"}
              </TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell>{row.initials ?? "—"}</TableCell>
              <TableCell>{salesRepresentativeLabel(row.representative)}</TableCell>
              <TableCell>{invoicePaymentTermLabel(row.paymentTerms)}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.creditLimit)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.creditLimitUninsured)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.creditInsurance)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.creditInsuranceDate)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.outstanding)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.currentOrders)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.creditSpace)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.oldestInvoiceDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.oldestDueDate)}
              </TableCell>
              <TableCell className="text-center">
                {row.blocked ? "Yes" : "No"}
              </TableCell>
              <TableCell>{row.vatNumber ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenueThisYear)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenueLastYear)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenueTwoYearsAgo)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
