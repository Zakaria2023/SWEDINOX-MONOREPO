"use client";

import { Check } from "lucide-react";
import { SupplierRow } from "@/app/(dashboard)/suppliers/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

type Props = {
  rows: SupplierRow[];
};

const flag = (value: boolean) =>
  value ? (
    <Check className="mx-auto size-4 text-green-600" />
  ) : (
    <span className="text-muted-foreground">—</span>
  );

const fullName = (first: string | null, last: string | null) => {
  const name = [first, last].filter(Boolean).join(" ");
  return name.length > 0 ? name : "—";
};

export const SuppliersTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Search code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="text-center">Supplier</TableHead>
          <TableHead className="text-center">Processor</TableHead>
          <TableHead className="text-center">Transporter</TableHead>
          <TableHead className="text-center">Agent</TableHead>
          <TableHead className="text-center">Other</TableHead>
          <TableHead className="text-center">Customer</TableHead>
          <TableHead className="text-center">Prospect</TableHead>
          <TableHead>Visit city</TableHead>
          <TableHead>Purchaser</TableHead>
          <TableHead>Payment terms</TableHead>
          <TableHead>Corresp. address</TableHead>
          <TableHead>Corresp. city</TableHead>
          <TableHead>Corresp. country</TableHead>
          <TableHead>Telephone</TableHead>
          <TableHead>Contact person</TableHead>
          <TableHead>Contact e-mail</TableHead>
          <TableHead>Contact mobile</TableHead>
          <TableHead className="text-right">Company code</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={20}
              className="h-24 text-center text-muted-foreground"
            >
              No suppliers found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.companyUuid}>
              <TableCell className="font-medium whitespace-nowrap">
                {row.searchCode3 ?? row.searchCode1 ?? "—"}
              </TableCell>
              <TableCell>{row.companyName}</TableCell>
              <TableCell className="text-center">
                {flag(row.isSupplier)}
              </TableCell>
              <TableCell className="text-center">
                {flag(row.isProcessor)}
              </TableCell>
              <TableCell className="text-center">
                {flag(row.isTransporter)}
              </TableCell>
              <TableCell className="text-center">{flag(row.isAgent)}</TableCell>
              <TableCell className="text-center">{flag(row.isOther)}</TableCell>
              <TableCell className="text-center">
                {flag(row.isCustomer)}
              </TableCell>
              <TableCell className="text-center">
                {flag(row.isProspect)}
              </TableCell>
              <TableCell>{row.visitCity ?? "—"}</TableCell>
              <TableCell>
                {row.representative
                  ? SALES_REPRESENTATIVE_LABELS[row.representative]
                  : "—"}
              </TableCell>
              <TableCell>
                {row.paymentTerms
                  ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms]
                  : "—"}
              </TableCell>
              <TableCell>{row.correspondenceStreetAndNo ?? "—"}</TableCell>
              <TableCell>{row.correspondenceCity ?? "—"}</TableCell>
              <TableCell>{row.correspondenceCountry ?? "—"}</TableCell>
              <TableCell>{row.correspondenceTelephone ?? "—"}</TableCell>
              <TableCell>
                {fullName(row.contactFirstName, row.contactLastName)}
              </TableCell>
              <TableCell>{row.contactEmail ?? "—"}</TableCell>
              <TableCell>{row.contactMobile ?? "—"}</TableCell>
              <TableCell className="text-right">{row.companyCode}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
