"use client";

import { CertificateToLinkRow } from "@/app/(dashboard)/certificates-to-be-linked/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  rows: CertificateToLinkRow[];
};

const Dash = () => <span className="text-muted-foreground">—</span>;

export const CertificatesToBeLinkedTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Created on</TableHead>
          <TableHead>Adjusted on</TableHead>
          <TableHead>Adjusted by</TableHead>
          <TableHead>Final destination</TableHead>
          <TableHead>Specification</TableHead>
          <TableHead>Lowest purchase price</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Receipt status</TableHead>
          <TableHead>Highest purchase price</TableHead>
          <TableHead>Work panel</TableHead>
          <TableHead>Receive data storage</TableHead>
          <TableHead>Receive data</TableHead>
          <TableHead>Data sent storage</TableHead>
          <TableHead>Data sent</TableHead>
          <TableHead>Invoked method</TableHead>
          <TableHead>Retry possible</TableHead>
          <TableHead>Last error message</TableHead>
          <TableHead>Error message</TableHead>
          <TableHead>User interaction required</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={20}
              className="h-24 text-center text-muted-foreground"
            >
              No certificates to be linked.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.createdOn)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.adjustedOn)}
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>{row.specification ?? "—"}</TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell>To be linked</TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
