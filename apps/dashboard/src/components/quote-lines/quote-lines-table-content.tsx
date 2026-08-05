"use client";

import Link from "next/link";
import { QuoteLineRow } from "@/app/(dashboard)/quote-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  formatPercent,
  initialsOf,
} from "@/lib/helpers";
import {
  CUSTOMER_GROUP_LABELS,
  ORDER_LINE_STATUS_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

type Props = {
  rows: QuoteLineRow[];
};

const COLUMN_COUNT = 46;

export const QuoteLinesTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Quote</TableHead>
          <TableHead>Our reference</TableHead>
          <TableHead>Quote date</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead>Order type</TableHead>
          <TableHead className="text-right">Customer code</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Decision date</TableHead>
          <TableHead>Validity date</TableHead>
          <TableHead>Seller</TableHead>
          <TableHead>Initials</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Last follow-up date</TableHead>
          <TableHead>Last follow-up</TableHead>
          <TableHead>Last follow-up by</TableHead>
          <TableHead className="text-right">Quote line</TableHead>
          <TableHead>Creation date</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Line type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Length (mm)</TableHead>
          <TableHead className="text-right">Width (mm)</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Gross price</TableHead>
          <TableHead>PriceU</TableHead>
          <TableHead className="text-right">Group discount</TableHead>
          <TableHead className="text-right">Line discount</TableHead>
          <TableHead className="text-right">Net price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Cost price</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit margin</TableHead>
          <TableHead className="text-right">Revenue group code</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead>Expiration reason</TableHead>
          <TableHead>Converted to</TableHead>
          <TableHead>Consignment</TableHead>
          <TableHead>Affiliate company</TableHead>
          <TableHead>Customer group</TableHead>
          <TableHead>Reference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No quote lines found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/quote-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.quoteId ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.ourReference ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.quoteDate)}
              </TableCell>
              <TableCell className="text-right">
                {row.quoteMonth ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.quoteYear ?? "—"}
              </TableCell>
              <TableCell>{row.orderType}</TableCell>
              <TableCell className="text-right">
                {row.customerCode ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.customerName ?? "—"}
              </TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.decisionDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.validUntil)}
              </TableCell>
              <TableCell>{row.seller ?? "—"}</TableCell>
              <TableCell>{initialsOf(row.seller)}</TableCell>
              <TableCell>
                {row.representative
                  ? SALES_REPRESENTATIVE_LABELS[row.representative]
                  : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.lastFollowUpDate)}
              </TableCell>
              <TableCell className="max-w-64">
                <span className="line-clamp-1">{row.lastFollowUp ?? "—"}</span>
              </TableCell>
              <TableCell>{row.lastFollowUpBy ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deliveryDate)}
              </TableCell>
              <TableCell>{row.lineType ?? "—"}</TableCell>
              <TableCell>
                {row.status ? ORDER_LINE_STATUS_LABELS[row.status] : "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.quantity ?? 0))}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.description ?? row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.weightKg ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.grossPrice ?? 0))}
              </TableCell>
              <TableCell>{row.priceUnit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatPercent(Number(row.groupDiscount ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(Number(row.lineDiscount ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.netPrice ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.amount ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.costPrice ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.profit ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(Number(row.profitMargin ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell>{row.expirationReason ?? "—"}</TableCell>
              <TableCell>
                {row.convertedToOrderId
                  ? `Order ${row.convertedToOrderId}`
                  : "—"}
              </TableCell>
              <TableCell>{row.isConsignment ? "Yes" : "No"}</TableCell>
              <TableCell>{row.affiliateCompany ?? "—"}</TableCell>
              <TableCell>
                {row.customerGroup
                  ? CUSTOMER_GROUP_LABELS[row.customerGroup]
                  : "—"}
              </TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
