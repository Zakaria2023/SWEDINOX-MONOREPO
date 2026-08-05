import { DashboardMonth } from "@/app/(dashboard)/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  formatMoney,
  formatNumber,
  formatPercentOneDecimal,
  profitMarginPercent,
} from "@/lib/helpers";

type MonthlyFiguresTableProps = {
  months: DashboardMonth[];
};

export const MonthlyFiguresTable = ({ months }: MonthlyFiguresTableProps) => {
  const totals = months.reduce(
    (accumulated, month) => ({
      revenue: accumulated.revenue + month.revenue,
      profit: accumulated.profit + month.profit,
      orderCount: accumulated.orderCount + month.orderCount,
      orderValue: accumulated.orderValue + month.orderValue,
      quoteCount: accumulated.quoteCount + month.quoteCount,
      quoteValue: accumulated.quoteValue + month.quoteValue,
    }),
    {
      revenue: 0,
      profit: 0,
      orderCount: 0,
      orderValue: 0,
      quoteCount: 0,
      quoteValue: 0,
    },
  );

  return (
    <CollapsibleSection
      title="Monthly figures"
      summary="Every value plotted above, as numbers"
    >
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Invoiced</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Order value</TableHead>
              <TableHead className="text-right">Quotes</TableHead>
              <TableHead className="text-right">Quote value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((month) => (
              <TableRow key={month.key}>
                <TableCell className="font-medium">{month.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(month.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(month.profit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercentOneDecimal(
                    profitMarginPercent(month.revenue, month.profit),
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(month.orderCount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(month.orderValue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(month.quoteCount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(month.quoteValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totals.revenue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totals.profit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercentOneDecimal(
                  profitMarginPercent(totals.revenue, totals.profit),
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(totals.orderCount)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totals.orderValue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(totals.quoteCount)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totals.quoteValue)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </CollapsibleSection>
  );
};
