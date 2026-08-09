"use client";

import { SupplierRow } from "@/app/(dashboard)/suppliers/actions";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { fullName } from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: SupplierRow[];
};

export const SuppliersTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="suppliers-table"
          fileName="suppliers"
          sheetName="Suppliers"
        />
      </div>
      <Table id="suppliers-table">
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
                  {<BooleanFlag on={row.isSupplier} label="Supplier" />}
                </TableCell>
                <TableCell className="text-center">
                  {<BooleanFlag on={row.isProcessor} label="Processor" />}
                </TableCell>
                <TableCell className="text-center">
                  {<BooleanFlag on={row.isTransporter} label="Transporter" />}
                </TableCell>
                <TableCell className="text-center">
                  {<BooleanFlag on={row.isAgent} label="Agent" />}
                </TableCell>
                <TableCell className="text-center">
                  {<BooleanFlag on={row.isOther} label="Other" />}
                </TableCell>
                <TableCell className="text-center">
                  {<BooleanFlag on={row.isCustomer} label="Customer" />}
                </TableCell>
                <TableCell className="text-center">
                  {<BooleanFlag on={row.isProspect} label="Prospect" />}
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
  </div>
);
