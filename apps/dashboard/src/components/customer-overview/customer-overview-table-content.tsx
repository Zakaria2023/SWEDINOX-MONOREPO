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
import { CustomerGroup, SalesRepresentative } from "@/lib/enums";
import { formatRevenue } from "@/lib/helpers";
import {
  CUSTOMER_GROUP_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

type Props = {
  customers: CustomerOverviewRow[];
};

const COLUMN_COUNT = 21;

const cellValue = (value: string | number | null) =>
  value === null || value === "" ? "—" : value;

const representativeLabel = (value: string | null) =>
  value
    ? (SALES_REPRESENTATIVE_LABELS[value as SalesRepresentative] ?? value)
    : null;

const customerGroupLabel = (value: string | null) =>
  value ? (CUSTOMER_GROUP_LABELS[value as CustomerGroup] ?? value) : null;

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
              <TableCell>{cellValue(row.searchCode1)}</TableCell>
              <TableCell>{cellValue(row.searchCode2)}</TableCell>
              <TableCell>{cellValue(row.searchCode3)}</TableCell>
              <TableCell>{cellValue(row.streetAndNo)}</TableCell>
              <TableCell>{cellValue(row.city)}</TableCell>
              <TableCell>{cellValue(row.postalCode)}</TableCell>
              <TableCell>{cellValue(row.initials)}</TableCell>
              <TableCell>
                {cellValue(representativeLabel(row.representative))}
              </TableCell>
              <TableCell>
                {cellValue(representativeLabel(row.accountManager))}
              </TableCell>
              <TableCell>{cellValue(row.regionCode)}</TableCell>
              <TableCell>{cellValue(row.region)}</TableCell>
              <TableCell>
                {cellValue(customerGroupLabel(row.customerGroup))}
              </TableCell>
              <TableCell>{cellValue(row.vatNumber)}</TableCell>
              <TableCell>
                {cellValue(
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
