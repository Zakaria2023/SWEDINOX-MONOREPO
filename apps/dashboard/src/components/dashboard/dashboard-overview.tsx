import { DashboardOverview as DashboardOverviewData } from "@/app/(dashboard)/actions";
import { BarList } from "@/components/dashboard/bar-list";
import { ChartCard } from "@/components/dashboard/chart-card";
import { ColumnChart } from "@/components/dashboard/column-chart";
import { Meter } from "@/components/dashboard/meter";
import { MonthlyFiguresTable } from "@/components/dashboard/monthly-figures-table";
import { Sparkline } from "@/components/dashboard/sparkline";
import { StatTile } from "@/components/dashboard/stat-tile";
import {
  complaintStatuses,
  orderStatuses,
  purchaseOrderStatuses,
} from "@/lib/enums";
import {
  countLabel,
  describeRevenueChange,
  formatCompactMoney,
  formatDateValue,
  formatMoney,
  formatNumber,
  formatPercentOneDecimal,
} from "@/lib/helpers";
import {
  AGEING_BUCKET_LABELS,
  COMPLAINT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/labels";

type DashboardOverviewProps = {
  overview: DashboardOverviewData;
};

export const DashboardOverview = ({ overview }: DashboardOverviewProps) => {
  const {
    asOf,
    months,
    revenue,
    receivables,
    orders,
    quotes,
    purchasing,
    stock,
    companies,
    complaints,
    topCustomers,
  } = overview;

  const previousYear = new Date(asOf).getFullYear() - 1;
  const monthLabels = months.map((month) => month.label);

  const orderStatusRows = orderStatuses
    .map((status) => {
      const slice = orders.byStatus.find((entry) => entry.status === status);
      return {
        key: status,
        label: ORDER_STATUS_LABELS[status],
        value: slice?.value ?? 0,
        count: slice?.count ?? 0,
      };
    })
    .filter((row) => row.count > 0);

  const purchaseStatusRows = purchaseOrderStatuses
    .map((status) => {
      const slice = purchasing.byStatus.find(
        (entry) => entry.status === status,
      );
      return {
        key: status,
        label: PURCHASE_ORDER_STATUS_LABELS[status],
        value: slice?.value ?? 0,
        count: slice?.count ?? 0,
      };
    })
    .filter((row) => row.count > 0);

  const complaintStatusRows = complaintStatuses
    .map((status) => {
      const slice = complaints.byStatus.find(
        (entry) => entry.status === status,
      );
      return {
        key: status,
        label: COMPLAINT_STATUS_LABELS[status],
        value: slice?.count ?? 0,
      };
    })
    .filter((row) => row.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <StatTile
            emphasis
            label={`Invoiced revenue ${new Date(asOf).getFullYear()} to date`}
            value={formatCompactMoney(revenue.yearToDate)}
            delta={describeRevenueChange(revenue.changePercent, previousYear)}
            hint={`${formatMoney(revenue.yearToDate)} excluding VAT · ${formatPercentOneDecimal(
              revenue.marginPercent,
            )} margin`}
            visual={
              <Sparkline
                values={months.map((month) => month.revenue)}
                label="Invoiced revenue over the last twelve months"
              />
            }
          />
        </div>
        <StatTile
          label="Outstanding receivables"
          value={formatCompactMoney(receivables.outstanding)}
          hint={`${formatMoney(receivables.outstanding)} across ${countLabel(
            receivables.openItems,
            "open item",
          )}`}
          delta={{
            text: `${formatCompactMoney(receivables.overdue)} overdue on ${countLabel(
              receivables.overdueItems,
              "invoice",
            )}`,
            direction: receivables.overdue > 0 ? "up" : "flat",
          }}
        />
        <StatTile
          label="Live order book"
          value={formatCompactMoney(orders.liveValue)}
          hint={`${countLabel(orders.liveCount, "order")} open or confirmed`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Open quotes"
          value={formatCompactMoney(quotes.openValue)}
          hint={`${countLabel(quotes.openCount, "quote")} still valid · ${formatNumber(
            quotes.expiredCount,
          )} expired`}
        />
        <StatTile
          label="Purchase commitments"
          value={formatCompactMoney(purchasing.liveValue)}
          hint={`${countLabel(purchasing.liveCount, "purchase order")} not yet completed`}
        />
        <StatTile
          label="Stock valuation"
          value={formatCompactMoney(stock.valuation)}
          hint={`${formatNumber(Math.round(stock.weightKg))} kg over ${countLabel(
            stock.lines,
            "lot",
          )} received`}
        />
        <StatTile
          label="Complaints in hand"
          value={formatNumber(complaints.openCount)}
          hint={`${countLabel(
            complaints.byStatus.reduce(
              (total, slice) => total + slice.count,
              0,
            ),
            "complaint",
          )} on file in total`}
        />
      </div>

      <ChartCard
        title="Invoiced revenue per month"
        description="The last twelve months, excluding VAT. A cancelled invoice drops out and a credit note reduces the month it falls in."
        footer={`${formatMoney(revenue.lastTwelveMonths)} invoiced over the period shown.`}
      >
        <ColumnChart
          labels={monthLabels}
          series={[
            {
              key: "revenue",
              label: "Invoiced excluding VAT",
              values: months.map((month) => month.revenue),
              tone: "strong",
            },
          ]}
          valueFormat="money"
          ariaLabel="Invoiced revenue per month over the last twelve months"
          emptyMessage="Nothing has been invoiced in the last twelve months."
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Orders and quotes raised per month"
          description="How much work came in, counted by the month the document was created."
        >
          <ColumnChart
            labels={monthLabels}
            series={[
              {
                key: "orders",
                label: "Orders",
                values: months.map((month) => month.orderCount),
                tone: "strong",
              },
              {
                key: "quotes",
                label: "Quotes",
                values: months.map((month) => month.quoteCount),
                tone: "muted",
              },
            ]}
            valueFormat="number"
            ariaLabel="Orders and quotes raised per month over the last twelve months"
            emptyMessage="No orders or quotes were raised in the last twelve months."
          />
        </ChartCard>

        <ChartCard
          title="Value quoted and ordered per month"
          description="The same twelve months by value, so a single large order is not read as a busy month."
        >
          <ColumnChart
            labels={monthLabels}
            series={[
              {
                key: "order-value",
                label: "Ordered",
                values: months.map((month) => month.orderValue),
                tone: "strong",
              },
              {
                key: "quote-value",
                label: "Quoted",
                values: months.map((month) => month.quoteValue),
                tone: "muted",
              },
            ]}
            valueFormat="money"
            ariaLabel="Value ordered and quoted per month over the last twelve months"
            emptyMessage="No order or quote value was recorded in the last twelve months."
          />
        </ChartCard>

        <ChartCard
          title="Receivables by age"
          description={`What is still owed, measured from each invoice's due date as at ${formatDateValue(asOf, "—")}.`}
          footer={`${formatMoney(receivables.overdue)} of ${formatMoney(
            receivables.outstanding,
          )} is past its term.`}
        >
          <BarList
            items={receivables.buckets.map((bucket) => ({
              key: bucket.bucket,
              label: AGEING_BUCKET_LABELS[bucket.bucket],
              value: bucket.amount,
            }))}
            valueFormat="money"
            tone="ordinal"
            emptyMessage="Nothing is outstanding on the sales ledger."
          />
        </ChartCard>

        <ChartCard
          title="Order book by status"
          description="Every sales order on file, by where it has got to."
        >
          <BarList
            items={orderStatusRows.map((row) => ({
              key: row.key,
              label: row.label,
              value: row.value,
              meta: countLabel(row.count, "order"),
            }))}
            valueFormat="money"
            tone="ordinal"
            emptyMessage="No sales orders have been raised yet."
          />
        </ChartCard>

        <ChartCard
          title="Purchase orders by status"
          description="What has been committed to suppliers, and how much of it has still to arrive."
        >
          <BarList
            items={purchaseStatusRows.map((row) => ({
              key: row.key,
              label: row.label,
              value: row.value,
              meta: countLabel(row.count, "purchase order"),
            }))}
            valueFormat="money"
            tone="ordinal"
            emptyMessage="No purchase orders have been raised yet."
          />
        </ChartCard>

        <ChartCard
          title="Largest customers"
          description="Invoiced revenue per customer over the last twelve months."
        >
          <BarList
            items={topCustomers.map((customer) => ({
              key: customer.companyUuid ?? "unassigned",
              label: customer.companyName ?? "Not assigned to a company",
              value: customer.revenue,
              meta: countLabel(customer.invoiceCount, "invoice"),
              href: customer.companyUuid
                ? `/companies/${customer.companyUuid}`
                : undefined,
            }))}
            valueFormat="money"
            emptyMessage="Nothing has been invoiced in the last twelve months."
          />
        </ChartCard>

        <ChartCard
          title="Stock"
          description="Received lots only — what is physically in the warehouse and what it is worth."
        >
          <div className="space-y-4">
            <Meter
              label="Reserved against orders"
              percent={stock.reservedPercent}
              caption={`${formatNumber(
                Math.round(stock.weightKg),
              )} kg on hand, ${countLabel(stock.blockedLines, "lot")} blocked.`}
            />
            <BarList
              items={[
                {
                  key: "valuation",
                  label: "Stock valuation",
                  value: stock.valuation,
                },
              ]}
              valueFormat="money"
              emptyMessage="No stock has been received yet."
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Complaints by status"
          description="Where each complaint on file has got to."
        >
          <BarList
            items={complaintStatusRows}
            valueFormat="number"
            tone="ordinal"
            emptyMessage="No complaints have been recorded."
          />
        </ChartCard>

        <ChartCard
          title="Companies on file"
          description="A company can hold several roles, so the roles add up to more than the total."
          footer={`${countLabel(companies.total, "company")} in total, ${formatNumber(
            companies.inactive,
          )} marked inactive.`}
        >
          <BarList
            items={[
              {
                key: "customer",
                label: "Customers",
                value: companies.customers,
                href: "/customers-and-prospects",
              },
              {
                key: "prospect",
                label: "Prospects",
                value: companies.prospects,
                href: "/customers-and-prospects",
              },
              {
                key: "supplier",
                label: "Suppliers",
                value: companies.suppliers,
                href: "/suppliers",
              },
            ]}
            valueFormat="number"
            emptyMessage="No companies have been created yet."
          />
        </ChartCard>
      </div>

      <MonthlyFiguresTable months={months} />
    </div>
  );
};
