import { ChargeListItem } from "@/app/(dashboard)/charges/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { salesDocumentStatusLabel } from "@/lib/helpers";

/**
 * Charges as a sheet, in the reference's column order with its Dutch headings
 * translated.
 *
 * ⚠️ **A surcharge is not always in euros.** `Decoil surcharge` and `Cutting
 * surcharge` are charged **per tonne** and post to the 3000 processing band —
 * they are processing charges wearing a surcharge coat. `Project discount` is
 * a negative charge, the same mechanism used to give money back.
 *
 * ⚠️ **`Vanaf` / `T/m` are weight-band bounds, and three of the values are
 * sentinels, not weights.** Only `External transport` uses real bands; `0–125`
 * on every non-freight surcharge means *no band, flat charge*, and `0–999999`
 * means unbounded — the same `999999` a coil's length uses. Reading 125 as
 * kilos would invent a tariff that does not exist.
 *
 * Two of the reference's columns print blank and are hidden by default.
 * `Region number` is `0` on every row, and `Bedrag valuta` — the amount in a
 * foreign currency — is non-zero on **3 of its 1 504 rows** and we have no
 * currency model at all, so there is nothing to put in it.
 *
 * 🔴 **`Profit` is carried as two numbers, not one string.** The reference
 * packs the amount and the margin into a single cell in Dutch format,
 * `€ 85,00 (100 %)`, and renders `( %)` when the revenue is zero. A number that
 * cannot be summed or sorted is not a number.
 */

export type ChargeColumnKey =
  | "orderType"
  | "code"
  | "creationDate"
  | "deliveryDate"
  | "revenueGroupName"
  | "customerName"
  | "customerCode"
  | "surcharge"
  | "contract"
  | "profit"
  | "profitMargin"
  | "amount"
  | "weightKg"
  | "cost"
  | "priceTo"
  | "priceFrom"
  | "price"
  | "unit"
  | "debtorNo"
  | "region"
  | "country"
  | "vatNumber"
  | "status"
  | "regionNumber"
  | "amountCurrency";

export const CHARGE_COLUMNS: Array<
  ExportColumn<ChargeListItem, ChargeColumnKey>
> = [
  {
    key: "orderType",
    label: "Sales order type",
    defaultVisible: true,
    value: (row) => textCell(row.orderType),
  },
  {
    key: "code",
    label: "Code",
    defaultVisible: true,
    value: (row) => textCell(row.code),
  },
  {
    key: "creationDate",
    label: "Creation date",
    defaultVisible: true,
    value: (row) => dateCell(row.creationDate),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "revenueGroupName",
    label: "Revenue group",
    defaultVisible: true,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "customerName",
    label: "Customer name",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.customerCode),
  },
  {
    key: "surcharge",
    label: "Surcharge",
    defaultVisible: true,
    value: (row) => textCell(row.surcharge),
  },
  {
    // A surcharge can be governed by a named contract rather than the standing
    // tariff -- 8 of the reference's 1 504 rows.
    key: "contract",
    label: "Contract",
    defaultVisible: false,
    value: (row) => textCell(row.contract),
  },
  {
    key: "profit",
    label: "Profit",
    defaultVisible: true,
    value: (row) => numberCell(row.profit),
  },
  {
    key: "profitMargin",
    label: "Profit margin",
    defaultVisible: true,
    value: (row) => {
      const amount = Number(row.amount ?? 0);
      const profit = Number(row.profit ?? 0);
      return numberCell(amount === 0 ? 0 : (profit / Math.abs(amount)) * 100);
    },
  },
  {
    key: "amountCurrency",
    label: "Amount (currency)",
    defaultVisible: false,
    // `Bedrag valuta`: non-zero on 3 of the reference's 1 504 rows. Every
    // charge here is in euros, so there is no foreign amount to print.
    value: () => null,
  },
  {
    key: "amount",
    label: "Amount",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    // Equal to the amount on 1 142 of the reference's rows: charged at cost.
    key: "cost",
    label: "Costs",
    defaultVisible: false,
    value: (row) => numberCell(row.cost),
  },
  {
    key: "priceTo",
    label: "Up to (kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.priceTo),
  },
  {
    key: "priceFrom",
    label: "From (kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.priceFrom),
  },
  {
    key: "price",
    label: "Price",
    defaultVisible: false,
    value: (row) => numberCell(row.price),
  },
  {
    key: "unit",
    label: "QtyU",
    defaultVisible: true,
    value: (row) => textCell(row.unit),
  },
  {
    key: "debtorNo",
    label: "Debtor no.",
    defaultVisible: false,
    value: (row) => textCell(row.debtorNo),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    // The zone axis of the freight tariff: the price rises with weight and
    // with distance, so the band alone does not fix it.
    key: "region",
    label: "Region",
    defaultVisible: false,
    value: (row) => textCell(row.region),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: false,
    value: (row) => textCell(row.country),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: false,
    value: (row) => textCell(row.vatNumber),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => textCell(salesDocumentStatusLabel(row.status)),
  },
];
