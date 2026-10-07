# Planned code changes — from the line-type grouping, 7-10-2026

**Source:** Step 6 of the capture runsheet — `Purchase lines` grouped on
`Line type`, then the one `EXW` row read across its full width. Written up in
[purchase/purchase-lines.md](purchase/purchase-lines.md) *Step 6 answered* and
[order-types.md](order-types.md).

Record used: purchase order **`400143/10`** (Decomecc N.V., batch `25AATY`).

> **Why this file exists.** Swedinox asked on 7-10-2026 for the code to stop
> after commit `067f4cbe` and for everything the capture still asks of the code
> to be written down instead. This is that list. Nothing below is built.

**Ordering is by cost of being wrong.** 1–2 are wrong stock. 3–5 are a wrong
floor. 6–8 are missing fields.

---

## 1. 🔴 A `CD` or `EXW` purchase line must not put a lot on our shelf

**What was found.** `Line type` is a mode of the trade: `Stk` lands in our
warehouse, `CD` goes supplier → our lorry → customer, `EXW` never comes near
us. Our receipt chain writes a `Stock` row and an `in` movement for **every**
reception, whatever the line's type.

**What is wrong.** A cross-docked parcel shows up as stock we can sell, and
the next order advice counts it.

**What to build.** In the receipt chain, branch on
`PurchaseOrderItems.sourceType` at the moment a reception is made final:

- `stock` — exactly as today.
- `cross_dock` — no shelf lot. The parcel still needs a weight, a charge, a
  certificate and a ledger line (`3170 Goods to be received` → cost of sales,
  not `3000 Stock`), and `CD deliveries in progress` needs the row until the
  sales line it covers is delivered.
- `ex_works` — see 2 before deciding; the one real row *did* go to stock.

**Before building.** ⚠️ Not captured. What the reference does on `Make final`
for a `CD` line has never been watched. Flow **H1** was watched on a `Stk`
line only. Do the capture first: find a `CD` line in `Purchase receivals`
and read its reception, its lot (if any) and its journal lines.

## 2. 🔴 `EXW` on a purchase line is a toll-processing return, and the code has no such thing

**What was found.** The only `EXW` purchase line in 21 months: € 0,05/TN,
`Qty ordered 0`, `Qty confirmed 0`, `Received`, internal certificate, booked
to `3000 Stock` at € 0,01. It is our own plate coming back from a processor.
Its purchase-order type reads `Ex works Pro…`.

**What is wrong.** We treat it as a purchase at € 0,05/TN. That lot's cost is
a cent; every sale from it reports a ~100 % margin, and the stock valuation
is short by the coil it was cut from.

**What to build.** Nothing until Step 6c (the order header) and H9 (external
processing) are captured. The likely shape: the return leg of an external
processing work order books the processed item in **at the cost of the metal
that went out plus the processing invoice**, and the nominal purchase order is
the reference's carrier for that, not a price.

**Also pending.** `purchaseOrderTypes` gains **`ex_works_processor`** —
the full caption is `Ex works Processor` (Step 6c, 7-10-2026). Fourth value;
label `Ex works Processor`; offered on the order form. 🔑 The header also
showed what makes such an order: its `Purchase reference` and its line's
`For line` both point at the *processing* order (`IO400142`) it returns
against, and its delivery address is the processor's own. So the shape is a
purchase order **raised against a line of another purchase order**, with the
supplier's address as the delivery address — `PurchaseOrders.forOrder` and
`PurchaseOrderItems` need a `forPurchaseOrderItemUuid` to carry it. Step 6d
(open `400142`) first.

## 3. 🟡 `minimumMarginFor` callers still read pick-up as ex works

**What was found.** The three minimum margins on a product are the three line
types. `minimumMarginFor` is now keyed on the type (`067f4cbe`). But sales
lines never carry a type — `OrderItems.sourceType` is written by nothing, so
it is `stock` on all 194 rows — and the two callers (`orders/actions.ts`,
`quotes/actions.ts`) still map `isPickup → "ex_works"`.

**What is wrong.** `Pick-up` is a separate boolean in the reference (307
`Normal` pick-up orders against one `Ex works` one), so 307 orders are held to
the ex-works floor that only one should be.

**What to build.** A `Type` on the sales line (`Stk` · `Stk+CD` · `CD` ·
`EXW`), set in the order and quote line editors, defaulting to `stock`; then
the callers pass `item.sourceType` and the `isPickup` mapping goes. The
client-side copy of the same pick in `quote-lines-editor.tsx` (lines ~247–250)
goes with it.

## 4. 🟡 Nothing ever sets a sales line to `cross_dock`

**What was found.** `OrderItems.purchaseOrderItemUuid` exists for the
cross-dock link and `CD deliveries in progress` reads it, but no action writes
either it or `sourceType = "cross_dock"`.

**What to build.** When a purchase line is raised *for* a sales line (the
`For order` field on the purchase order header), set the sales line's
`sourceType` to `cross_dock` (or `stock_and_cross_dock` if it already holds a
reservation) and point `purchaseOrderItemUuid` at the new line. Capture
first: what the reference does on the sales line when a CD purchase is raised
against it.

## 5. 🟡 Revenue-vs-budget actuals can now split three ways

**What was found.** PLANNED-CODE-CHANGES-5 §S8 noted *"our order lines have no
factory source type, so the report's actuals do not split by type"*. They do
now (`ex_works`).

**What to build.** Split the actuals in `revenue-vs-budget/actions.ts` on
`OrderItems.sourceType` → `revenueStock` / `revenueCrossDock` /
`revenueFactory`, so the three budget columns are compared against three
actuals instead of one total. Worthless until 3 and 4 give the lines a type.

## 6. 🟢 Counts for `CD` and `Stk`

The grid's group headers carry no counts, so the sizes of the two big groups
are unknown. Either expand each and read the row count off the status bar, or
take the purchase-lines export (`Toon in Excel`) and count there. Decides
whether 1 is a rare edge or a third of the buying.

## 7. 🟢 `Line type` on the purchase order detail

The reference's order-detail line grid prints `Type` per line
(purchase-order-detail.md). Ours stores it now and shows it only on the
`Purchase lines` overview; the detail page's line grid should carry it too.

## 8. 🟢 Lines cannot be edited after creation

`updatePurchaseOrder` takes the header only, so a line's type can be set once,
at creation. The reference allows it on a `Provisional` order. Out of scope
until line editing exists at all.

## 9. 🟡 `orderStatuses` lacks `converted` and `delivered`

**What was found.** Grouping `Orders and Quotes` on `Status` over 2024–2026
(Step 7) shows `Converted` and `Delivered`, neither in the export-derived
ten-value list nor in our enum.

**What to build.** Add both. `converted` is quote-side: set on the quote when
`Convert to order` runs (today the quote is presumably left at `released`),
terminal, and the overview filter must offer it. `delivered` is order-side,
between `partially_delivered` and `partially_invoiced`: set when the last
line's delivery completes and no invoice exists yet. Where `completed` then
sits — after `invoiced`, as today — stays unless the rows say otherwise.
✅ Confirmed 7-10-2026 from the expanded groups: `Converted` is quotes
only (`Q300013` → `O106623`), `Delivered` is orders only (`O105922`, 4 lines,
nothing invoiced), and `Completed` is a separate group, so both are new
rungs rather than renamings.

## 10. 🟡 `purchaseInvoiceStatuses` starts with a word the reference does not use

**What was found.** `Purchase invoices` grouped on `Status` since 2024:
`Provisional` and `Released`, nothing else. Ours: `new` · `released` ·
`final`.

**What to build.** Rename `new` → `provisional` (hand-ALTER the enum, never
`--force`; backfill `new` → `provisional`). ✅ The wider window (from 2020)
showed nothing more — the series starts at `600000` in January 2025 — so
**drop `final`** and whatever moves an invoice to it. 🔑 Add `bookingPeriod`
(int): `0` while provisional, set to the period on release — the reference
shows `0`/`1`, and that pair is what the status means.
