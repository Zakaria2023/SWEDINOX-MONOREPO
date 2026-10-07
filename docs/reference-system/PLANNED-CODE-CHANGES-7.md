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

## 11. 🔴 `purchaseOrderStatuses` does not match the reference

**What was found.** Decomecc's `Purchase orders` panel, 7-10-2026: `Expired`,
`Received`, `Invoiced`, `In progress` on seven orders. Earlier slices showed
`Invoiced` and `Received`. Ours: `provisional · open · confirmed ·
pre_notified · completed · cancelled` — none of the four seen, and
`open` / `confirmed` / `pre_notified` / `completed` never seen on a purchase
order header at all.

**What is wrong.** 39 call sites read these values. A received order shows as
`open`, an invoiced one as `completed`, and an expired one does not exist, so
nothing ever ages out.

✅ **Captured 7-10-2026:** grouping `Purchase orders and quotes` on `Status`
gives nine — `Checked · Delivered · Expired · In progress · Invoiced ·
Partially received · Provisional · Received · Released`.

**What to build.** `purchaseOrderStatuses` = `provisional · released ·
checked · in_progress · partially_received · received · delivered ·
invoiced · expired`, keeping `cancelled` only as ours (the reference
deletes). Map the existing rows `open → released`, `confirmed → released`
(confirmation becomes a flag), `pre_notified → released` (likewise),
`completed → invoiced`. Hand-ALTER, never `--force`. The earlier guess,
kept for the record: probably the
same ladder as the lines (`orderLineStatuses` already holds `provisional ·
released · checked · in_progress · partially_received · received ·
invoiced · expired`), rolled up from them. ⚠️ `pre_notified` and `confirmed`
may be flags on the header (the reference prints `Printed`, `Mailed`,
`Confirm`, `Pre-notify` as buttons and ticks) rather than rungs — keep them
as booleans if so.

🔑 **An expired purchase order disappears from both purchase overviews.**
Whatever filter `Purchase lines` and `Purchase orders and quotes` run, ours
must hide `expired` by default too, and the company record's panel must
still list it.

## 12. 🟢 `Journal code` is display-only

**What was found.** Greyed on the creditor and debtor panels of every company
tried (Vergeest `0`/`0`, Decomecc `0`/`11`). It is set by the ledger.

**What to build.** Nothing new — `Companies.journalCode` stays an `int`,
shown read-only on both panels, never a picker. Remove any editable input for
it if one exists.

## 13. 🟢 Parking orders — reservation holders at € 0

**What was found.** `Hego Reserveringen` holds stock on € 0 `Provisional`
sales orders whose `Customer reference` names the real party; eight of eleven
have since `Expired` at 0 kg. Their profit reads −100 % (cost with no
revenue).

**What to build.** Nothing structural: an order, its reservations and
`expired` already cover it. Two small things: (a) the overview's margin
column should not flag a € 0 provisional order as a loss — the reference
does, at −100 %, and it reads as noise; (b) `orderStatuses` already holds
`expired`, but nothing moves an order to it. When the reservation ages out —
the reference's rule is not captured — the order should expire.

## 14. 🟢 Call-offs are child records of the order

**What was found.** Order `100785`'s `Call-offs` panel: rows with their own
customer reference, delivery address, `Rush` and `IsSend`, a last-modified
user and date, and buttons `New · Delete · Change · Print call-off · Send…`.
The header carries a `Call-off period` window.

**What to check before building.** Whether `OrderCallOffs` (or equivalent)
already exists in our schema; if it does, compare columns; if not, this is a
table of its own, not fields on the order.

## 15. 🟡 Purchase returns end in `delivered`, and point at their order by reference

**What was found.** `Purchase orders and quotes` → `Delivered` holds three
`IR95xxxx` purchase returns, negative kg and revenue, each with the returned
purchase order's number in `Reference`.

**What is wrong.** `PurchaseReturnOrders.status` uses `returnOrderStatuses`
(`open · in_progress · received · credited · cancelled`), the sales return's
ladder. A purchase return is never `received` — it is `delivered` back.

**What to build.** Give purchase returns the purchase ladder from §11
(`provisional · released · … · delivered · invoiced`) rather than the
sales-return one, and show them in the purchase-orders overview with negative
weight and amount, numbered in their own series. `purchaseOrderUuid` /
`purchaseOrderReference` already exist for the link — make sure the overview
shows the reference.

## 16. 🔴 An offcut must inherit its parent lot's identity

**What was found (G9, from `stock-mutations.tsv`).** All 184 offcuts with an
internal charge share it with the lot they were cut from, and carry that
lot's supplier, charge and purchase order. The certificate chain survives a
saw cut.

**What to build.** When a cut reports a remnant, the new `Stock` row copies
`internalCharge`, `charge`, `plateNumber`, `supplierUuid` (or whatever holds
the mill) and the receipt / purchase-order link from the consumed lot — never
a fresh internal charge. Add a harness check: every remnant's internal charge
equals its parent's. ⚠️ Value: the reference books 121 of 191 offcuts at
€ 0; decide deliberately whether ours splits the cost by kilos instead.

## 17. 🟡 A processing reservation outlives the processing invoice

**What was found (G10).** A coil at `Bewerkers` is reserved `Definitive` to
`IO400366/10`, a `Processing` order invoiced in February 2025.

**What to build.** In our H9 model, keep the three steps separate: (1) the
processing order reserves the lot and moves it to the processor's location,
blocked; (2) the processing invoice is money only — it must **not** release
the reservation; (3) only the return leg (`ex_works_processor` receipt)
consumes the reserved lot and creates the processed one. Add a worklist for
lots still reserved to an invoiced processing order — the reference has none,
and this coil has sat there for twenty months.

## 18. 🟢 Two defaults on a new purchase request

**What was found (A6).** A blank `Purchase request` opens with `Purchase
order type` `Materials`, `Overlength` ☑, `Delivery address` our own yard
(`Bolderweg 10, Almere`) and `Deadline` = creation date + 1 day.

**What is different.** `purchase-requests/validation.ts` defaults
`purchaseOrderType` to `undefined`, `isOverlength` to `false` and
`deadline` to `""`.

**What to build.** Default the three to the reference's values, and the
delivery address to the company's own warehouse address. A purchase return
already defaults `returnDate` to today, as the reference does.

## 19. 🔴 Our purchase-line status strands every short delivery

**What was found (J4).** 22 of the 23 short-received lines since 2024 are
`Invoiced` or `Received`; only one is `Partially received`. Sixteen are
within the 5 % unloading tolerance; six were closed by hand, one at 6 of 17.

**What is wrong.** `derivePurchaseLineStatus` in
`lib/server/purchase-lines.ts` returns `received` only when `received >=
quantity` and `invoiced` only when `invoiced >= quantity`. A line that arrives
one plate short — 80 of 81 — sits at `partially_received` forever, and once
billed at `partially_invoiced`, a status the purchase header does not even
have. Sixteen real lines would be wrong in ours today.

**What to build.**
1. **Received within tolerance is received.** Compare `received` against
   `quantity × (1 − tolerance)` using the product's `toleranceUnloadingQty`
   (and `…Kg` for kilo lines) — the same tolerance the unloading report
   already enforces.
2. **A buyer can close a short line by hand.** A `Close line` action that
   sets the line to `received` (or `invoiced` once billed) at whatever
   arrived, and drops the open remainder reception. Record who and when.
3. **Invoiced is measured against received, not ordered.** Once a line is
   closed, `invoiced >= received` makes it `invoiced`. `partially_invoiced`
   stays for the sales side only.
4. Harness check: no closed purchase line keeps an open reception.

## 20. 🟡 `Par. return` creates a provisional return and a complaint in one step

**What was found (J8).** On a purchase order with lines still `Received`,
`Par. return` immediately saves a `Provisional` purchase return — next number
in its series, linked to the order, with a **new complaint** linked to it,
purchaser = the current user, return date = tomorrow, delivery address = the
supplier's, pick-up = our yard — and no lines. Lines are added afterwards,
each pointing at an order line (`Order line`). `Return` (whole order) stays
greyed while any line is not yet received.

**What to check and build.**
1. Our purchase-return creation: does it start from a purchase order and
   fill these defaults? Does it open a complaint? (Grep `complaintRef` —
   ours is a free-text `varchar`; the reference issues a complaint number.)
2. Return lines are picked **per receipt** — each row a reception/lot with
   its quantity, bill of lading and charge (`Create Purchase Return order
   lines`, 7-10-2026). Store the return line against the
   `PurchaseLineReceivals` row (and its lot), not only the order line. The
   picker opens on the latest delivery note and offers `All receipts`.
3. Gate the two buttons as the reference does: partial return when any line
   is `received`; full return only when all are.
