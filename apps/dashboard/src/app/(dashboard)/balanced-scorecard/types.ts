export type ScorecardStatus = "on_target" | "warning" | "off_target";
export type ScorecardTrend = "up" | "down" | "flat";

export type ScorecardRow = {
  key: string;
  category: string;
  kpi: string;
  value: number;
  target: number;
  unit: string;
  status: ScorecardStatus;
  trend: ScorecardTrend;
};

// The balanced-scorecard KPI framework. The KPIs and their categories are fixed;
// values and targets are placeholders until each KPI's real calculation and
// target are wired up (e.g. gross profit %, complaints %, turnover rate,
// loading degree, deviation count, sawing waste %).
export const SCORECARD: Omit<
  ScorecardRow,
  "value" | "target" | "status" | "trend"
>[] = [
  {
    key: "sale-gross-profit",
    category: "Sale",
    kpi: "Gross profit",
    unit: "%",
  },
  {
    key: "purchasing-complaints",
    category: "Purchasing",
    kpi: "Complaints purchasing",
    unit: "%",
  },
  {
    key: "purchasing-turnover-rate",
    category: "Purchasing",
    kpi: "Turnover rate",
    unit: "%",
  },
  {
    key: "logistics-loading-degree",
    category: "Logistics",
    kpi: "Loading degree",
    unit: "%",
  },
  { key: "logistics-euro", category: "Logistics", kpi: "—", unit: "Euro" },
  {
    key: "sale-complaints-orders",
    category: "Sale",
    kpi: "Complaints orders",
    unit: "%",
  },
  { key: "sale-percent", category: "Sale", kpi: "—", unit: "%" },
  {
    key: "logistics-deviation-count",
    category: "Logistics",
    kpi: "Deviation count",
    unit: "%",
  },
  {
    key: "logistics-saw-waste",
    category: "Logistics",
    kpi: "Saw waste",
    unit: "%",
  },
];
