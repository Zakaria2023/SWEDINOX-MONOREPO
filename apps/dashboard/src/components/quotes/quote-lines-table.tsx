import { QuoteLineDetail } from "@/app/(dashboard)/quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  orDash,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
} from "@/lib/labels";
import { AlertTriangle } from "lucide-react";

type Props = {
  items: QuoteLineDetail[];
};

// The saved lines, column for column as the reference system's "Quote lines"
// grid prints them. Every figure here was calculated when the quote was saved —
// nothing on this table is editable.
export const QuoteLinesTable = ({ items }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Quality</TableHead>
          <TableHead className="text-right">Qty(p)</TableHead>
          <TableHead>U</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Thickness</TableHead>
          <TableHead className="text-right">Kg(p)</TableHead>
          <TableHead className="text-right">M1(p)</TableHead>
          <TableHead className="text-right">Net Price</TableHead>
          <TableHead>U</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Purchase pr.</TableHead>
          <TableHead className="text-right">Costs</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit amount</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Profit too low</TableHead>
          <TableHead className="text-right">Width</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={24}
              className="h-24 text-center text-muted-foreground"
            >
              No lines on this quote.
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.uuid}>
              <TableCell className="font-medium">
                {orDash(item.productCode)}
              </TableCell>
              <TableCell>{orDash(item.lineType)}</TableCell>
              <TableCell>{formatDateColumn(item.deliveryDate)}</TableCell>
              <TableCell>
                <StatusBadge
                  value={item.status}
                  label={
                    item.status ? ORDER_LINE_STATUS_LABELS[item.status] : null
                  }
                />
              </TableCell>
              <TableCell>{orDash(item.productName)}</TableCell>
              <TableCell>{orDash(item.description)}</TableCell>
              <TableCell>{orDash(item.productGroupName)}</TableCell>
              <TableCell>
                {item.qualityStandard
                  ? PRODUCT_QUALITY_STANDARD_LABELS[item.qualityStandard]
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(item.quantity ?? 0))}
              </TableCell>
              <TableCell>{item.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(item.lengthMm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(item.thicknessMm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(item.weightKg ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(item.m1PerPiece ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(item.netPrice ?? 0))}
              </TableCell>
              <TableCell>{item.priceUnit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(item.amount ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(item.purchasePrice ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(item.costAmount ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercent(Number(item.profitMargin ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(item.profit ?? 0))}
              </TableCell>
              <TableCell>{orDash(item.reference)}</TableCell>
              <TableCell>
                {item.profitTooLow ? (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="size-3.5" />
                    Yes
                  </span>
                ) : (
                  "No"
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(item.widthMm)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
