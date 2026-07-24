"use client";

import Link from "next/link";
import { CustomerOverviewRow } from "@/app/(dashboard)/customer-overview/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { customerGroupLabel, formatRevenue, orDash, salesRepresentativeLabel } from "@/lib/helpers";

type Props = {
  customers: CustomerOverviewRow[];
};

const COLUMN_COUNT = 21;

export const CustomerOverviewTable = ({ customers }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer code</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Search code 1</TableHead>
          <TableHead>Search code 2</TableHead>
          <TableHead>Search code 3</TableHead>
          <TableHead>Street + No.</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Postal code</TableHead>
          <TableHead>Initials</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Account manager</TableHead>
          <TableHead>Region code</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Customer group</TableHead>
          <TableHead>VAT number</TableHead>
          <TableHead>Email to</TableHead>
          <TableHead className="text-right">Quotes</TableHead>
          <TableHead className="text-right">Orders</TableHead>
          <TableHead className="text-right">Invoices</TableHead>
          <TableHead className="text-right">Visit</TableHead>
          <TableHead className="text-right">Return orders</TableHead>
          <TableHead className="text-right">Complaints</TableHead>
          <TableHead>Last order date</TableHead>
          <TableHead className="text-right">Invoiced orders revenue</TableHead>
          <TableHead className="text-right">Avg. order size</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No customers found.
            </TableCell>
          </TableRow>
        ) : (
          customers.map((row) => (
            <TableRow key={row.companyUuid}>
              <TableCell>{row.customerCode}</TableCell>
              <TableCell>
                <Link
                  href={`/companies/${row.companyUuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.companyName}
                </Link>
              </TableCell>
              <TableCell>{orDash(row.searchCode1)}</TableCell>
              <TableCell>{orDash(row.searchCode2)}</TableCell>
              <TableCell>{orDash(row.searchCode3)}</TableCell>
              <TableCell>{orDash(row.streetAndNo)}</TableCell>
              <TableCell>{orDash(row.city)}</TableCell>
              <TableCell>{orDash(row.postalCode)}</TableCell>
              <TableCell>{orDash(row.initials)}</TableCell>
              <TableCell>
                {orDash(salesRepresentativeLabel(row.representative))}
              </TableCell>
              <TableCell>
                {orDash(salesRepresentativeLabel(row.accountManager))}
              </TableCell>
              <TableCell>{orDash(row.regionCode)}</TableCell>
              <TableCell>{orDash(row.region)}</TableCell>
              <TableCell>
                {orDash(customerGroupLabel(row.customerGroup))}
              </TableCell>
              <TableCell>{orDash(row.vatNumber)}</TableCell>
              <TableCell>
                {orDash(
                  row.actionEmailTo ??
                    row.releaseActionEmailTo ??
                    row.addressEmail ??
                    row.contactEmail,
                )}
              </TableCell>
              <TableCell className="text-right">{row.quotes}</TableCell>
              <TableCell className="text-right">{row.orders}</TableCell>
              <TableCell className="text-right">{row.invoices}</TableCell>
              <TableCell className="text-right">{row.visits}</TableCell>
              <TableCell className="text-right">{row.returnOrders}</TableCell>
              <TableCell className="text-right">{row.complaints}</TableCell>
              <TableCell>
                {row.lastOrderDate
                  ? new Date(row.lastOrderDate).toLocaleDateString("en-GB")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatRevenue(String(row.invoicedOrdersRevenue))}
              </TableCell>
              <TableCell className="text-right">
                {formatRevenue(String(row.avgOrderSize))}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
