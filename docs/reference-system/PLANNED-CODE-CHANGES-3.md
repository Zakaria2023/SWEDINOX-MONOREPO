# Planned code changes — round 3

Opened 13-9-2026 by the first Sales export ever taken: **item B1, Orders and
Quotes**, 2 091 rows × 40 columns. The evidence is in
[orders-and-quotes.md](orders-and-quotes.md).

Rounds 1 and 2 are [PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md) and
[PLANNED-CODE-CHANGES-2.md](PLANNED-CODE-CHANGES-2.md), both closed.

| #   |                                        |                                     |
| --- | -------------------------------------- | ----------------------------------- |
| 1   | `orderStatuses` is wrong — all four    | ✅ built ⚠️ needs the migration     |
| 2   | the margin formula                     | ✅ built — **and it was two rules**  |
| 3   | quotes need a status, not a boolean    | ✅ built                            |
| 4   | `Ex works` is a fourth order type      | ✅ built                            |
| 5   | returns are missing from the overview  | ✅ built — all four series          |
| 6   | `Representative` has no column         | ⚪ already modelled on the company   |
| 7   | `orderMethods` carries four inventions | ⚪ a note, no change                 |
| 8   | the price build-up: two units per line | ⚪ deferred — see below              |
| 9   | `Amount` and `Profit` per price unit   | ⚪ already built, now **checked**    |
| 10  | three status ladders, not one          | ✅ built ⚠️ needs the migration     |
| 11  | invoice lines: surcharge kind + splits | ✅ built                            |
| 12  | contract groups have two levels        | ⚪ deferred — three rows of evidence |
| 13  | freight is a weight-bracket tariff     | ⚪ held — the zone axis is unproved  |
| 14  | VAT, invoice type, payment terms       | ✅ type built; terms already there   |
| 15  | complaints, and paper-only returns     | ⚪ already modelled in full          |
| 16  | main group ≠ revenue group             | ⚪ already two columns               |

**Applied 13-9-2026.** The verification harness is at **143 checks, all
passing**, up from 115 — every rule below is now a test rather than a belief.

⚠️ **Two of them need a database migration before the app will run.** Items 1
and 10 replace the members of three populated enum columns:

```
node scripts/migrate-sales-statuses.mjs          # report only
node scripts/migrate-sales-statuses.mjs --apply  # then: pnpm db:push
```

The dry run reads: `Orders.status` 193 rows `open` → `provisional`,
`OrderItems.line_status` 194 rows unchanged, `OrderItems.delivery_status` 194
rows `not_ready` → `new`. It widens each enum, remaps, narrows, and aborts if a
single row is unaccounted for. **Never `db:push --force`** — it has offered to
truncate a populated table to widen an enum before.

### What turned out to be already built

Five items needed no code. The exports confirmed the existing model instead of
correcting it, which is worth as much:

- **`priceMeasureFor`** already implements every unit basis the export proves —
  `TN`, `KG`, `HK`, `ST`, `M1`, `M2`, `M3`, `MM`, `HM`, `HS`. Exact on 4.571 of
  4.975 order lines and **2.856 of 2.856** option rows.
- **`invoicePaymentTerms`** already carries all 20 observed codes, discounts
  included, out of 47.
- **Complaints** — `Complaints`, `ComplaintItems` and `VisitReports` all exist,
  and `ReturnOrderItems` already has `complaintUuid`, `originalOrderUuid`,
  `originalOrderItemUuid` and a `returnQty` separate from `quantity`. The
  paper-only return is already representable.
- **`Companies.representative` and `.accountManager`** both exist, on the
  company where C1 found them.
- **`companyRoles`**, **`customerGroups`**, **`contractTypes`**,
  **`searchCode1/2/3`** and **`websiteSorting`** all match what the screens
  showed.

### 🔴 Two columns I added and then took back out

Wiring the screens up is what caught them. Both would have given the schema two
ways to say one thing:

- **`Invoices.type`** duplicated **`Invoices.documentType`**, which already
  existed with `invoice` / `credit_note`. Removed, and the existing enum
  widened with `surcharge` and `correction` instead — the invoice filter maps
  over it, so all four now appear on the screen with no further change.
- **`InvoiceItems.kind`** duplicated the **`InvoiceSurcharges`** table, which
  already models charge lines and already feeds `Invoices.surchargesRevenue`.
  Removed, and `orderItemUuid` put back to `NOT NULL`. The reference's
  single-grid presentation is a *view* concern: the combined Invoice lines
  screen unions the two tables, exactly the way the Orders and Quotes overview
  unions four document tables.

The products/options split on the invoice line **stays** — `revenueProducts`,
`revenueOptions`, `profitProducts`, `profitOptions`. That is a different cut
from materials-versus-surcharges: an option is processing billed on the *same*
line as the metal, and both identities hold exactly across 5.650 rows.

### Screens, not just schema

- **Orders and Quotes** — a `Type` column, and the reference's own document
  codes (`O101450`, `R290012`, `Q300004`, `B250000`).
- **Quotes** — the overview said in a comment *"a quote has no status column"*.
  It has one now: a status column, a status filter, and the expiry checkbox
  writes both `expired` and `status` so the two can never disagree.
- **Companies** — the five per-customer settings from C1 wired through all five
  files the sales tab needs: the picked type, the read, the zod schema, the
  form, and the read-only detail.
- Every **filter and zod schema** for these enums maps over the enum array
  rather than listing values, so the order-status, order-type and invoice-type
  dropdowns picked up the new members on their own. That was worth checking
  rather than assuming.

### 🔴 What item 2 got wrong at first

The first attempt made `profitMarginPercent` divide by `|revenue|` everywhere.
The harness rejected it: the **Revenue per product** screen reads −502,20
revenue and −36,26 profit and prints **+7,2 %** — 36 of its 2.702 rows do — so
its divisor is *signed*.

There are two rules, not one:

| | divisor | revenue = 0 |
| --- | --- | --- |
| `profitMarginPercent` — reports, invoices | signed | `0` |
| `documentProfitMarginPercent` — orders, order lines | **absolute** | **±100** |

Both are now in `lib/helpers.ts`, both are checked, and the four screens that
inlined their own copy import one of them instead.

### ⚪ Item 8, deferred and why

The second net price — the same price restated in the product's unit — is
**derived, not stored**: `netPrice ÷ (weight per piece in the product's unit)`,
exact on all 841 mixed-unit lines. Adding a column would store what a helper
can compute, and the reference's own `Price -/- Cost price` shows the cost of
getting it wrong: it subtracts €/piece from €/tonne on those same 841 lines.
The conversion is now a harness check; the column can wait until a screen needs
to filter on it.

**Opened by eight exports on 13-9-2026**, ~43 000 rows in all:

| Item | Screen | Rows × cols | Write-up |
| --- | --- | --- | --- |
| B1 | Orders and Quotes | 2 091 × 40 | [orders-and-quotes.md](orders-and-quotes.md) |
| B2 | Order lines | 4 975 × 54 | [order-lines.md](order-lines.md) |
| B4 | Invoice lines | 5 650 × 43 | [invoice-lines.md](invoice-lines.md) |
| B5 | Deliveries | 6 134 × 54 | [deliveries.md](deliveries.md) |
| B6 | Quote lines | 9 × 46 | [order-lines.md](order-lines.md) §10 |
| B8 | Charges | 1 504 × 24 | [charges.md](charges.md) |
| B9 | Options | 2 890 × 31 | [sales-options-and-calloff.md](sales-options-and-calloff.md) |
| B3 | Invoices | 1 683 × 27 | [invoice-lines.md](invoice-lines.md) Part 2 |
| B7 | Return lines | 88 × 64 | [returns-and-complaints.md](returns-and-complaints.md) |
| B10 | Option prices per product | 54 × 16 | [product-prices.md](product-prices.md) §3 |
| B11 | Product prices | 19 383 × 47 | [product-prices.md](product-prices.md) ⚠️ **needs a re-run** |
| B13/B14 | Call-off screens | 55 / 691 | [sales-options-and-calloff.md](sales-options-and-calloff.md) |

---

## 1. 🔴 `orderStatuses` is wrong — every value

**Evidence:** all 2 091 rows. Ten distinct statuses, and not one of them is a
string we ship.

```ts
// lib/enums.ts — today
export const orderStatuses = ["open", "confirmed", "completed", "cancelled"];
```

The reference's ladder:

```
provisional → released → checked → in_progress
            → partially_delivered → partially_invoiced → invoiced → completed
```

plus `received` (return orders only) and `expired` (quotes only).

**Change:** replace the four values with the ten. `Orders.status` defaults to
`"open"` today — the reference's first rung is `Provisional`, which is what a
freshly typed document sits on (71 rows, and every `Lines = 0` row is one).

⚠️ **This is an enum widening on a populated column.** `drizzle-kit push`
handled an enum widening once by proposing `TRUNCATE OrderItems`. Run
`pnpm db:push` and **read the plan before confirming** — never `--force`.

⚠️ It is also a *replacement*, not a widening: existing rows hold `open` /
`confirmed` and need mapping (`open → provisional`, `confirmed → released`,
`completed → completed`, `cancelled` → has no reference equivalent; the
reference deletes rather than cancels, which is what the 154 gaps in the `O`
series are). Decide the mapping before pushing.

---

## 2. 🔴 `profitMarginPercent` is wrong on every return

**Evidence:** the reference's formula reproduces all 2 091 rows with **0
mismatches**; ours fails 44.

```ts
// lib/helpers.ts:2290 — today
export const profitMarginPercent = (revenue: number, profit: number): number =>
  revenue === 0 ? 0 : (profit / revenue) * 100;
```

Two defects:

1. **The divisor must be `|revenue|`.** A return has negative revenue, so
   dividing by it flips the sign of the margin.
2. **Revenue `0` does not mean margin `0`.** It means `100` when profit is
   positive and `-100` when negative. `O100756` — revenue `0`, profit `-0.11`,
   margin `-100`.

```ts
export const profitMarginPercent = (revenue: number, profit: number): number => {
  if (revenue === 0) {
    if (profit === 0) {
      return 0;
    }
    return profit > 0 ? 100 : -100;
  }
  return (profit / Math.abs(revenue)) * 100;
};
```

**Then remove the four hand-inlined copies** that bypass the helper and carry
the same two bugs:

- `app/(dashboard)/customer-revenue/actions.ts:92`
- `app/(dashboard)/customer-revenue-per-product-group/actions.ts:114`
- `app/(dashboard)/customer-revenue-per-revenue-group-split/actions.ts:146`
- `app/(dashboard)/order-lines/actions.ts:217`

All four are `x === 0 ? 0 : (profit / x) * 100`. Import the helper instead.

**Add to the verify harness:** the reference rounds to one decimal, and the
2 091-row file is a ready-made fixture. This should be a check, not a belief.

---

## 3. 🔴 A quote has a status; we gave it a boolean

**Evidence:** the six quotes carry `Provisional` (2), `Released` (2) and
`Expired` (2) — the same column, from the same list, as the orders.

`db/schema/quotes.ts` has no `status` column. It has
`expired: boolean("expired").default(false)` at line 97.

**Change:** give `Quotes` a `status` on the same enum as item 1, and derive
`expired` from it — or drop the boolean. A quote that is `Provisional` is not
"not expired", it is *earlier in the ladder*, and today those two states are
indistinguishable.

`Expiration reason` is a free-text field beside it: one row of 2 091 fills it,
`"Customer not accepted - price."` on `Q300003`. Worth a `varchar`, not an enum
— one sample proves nothing about the list.

---

## 4. `Ex works` is a fourth order type

**Evidence:** 1 row of 2 091 (`Released`, not a pick-up).

```ts
// lib/enums.ts:612
export const orderTypes = ["normal", "call_off", "rush"];
```

**Change:** add `"ex_works"`, and a label in `lib/labels.ts`.

One row is thin evidence for a *distribution*, but it is conclusive for
*membership* — the value exists in the reference's list. It is also a delivery
term (`EXW`) wearing an order-type hat, so check it does not duplicate
`deliveryTerms` before adding it.

The same export **confirms** the existing warning comment on `orderTypes`: this
column on the Orders and Quotes screen is the header dropdown, not the line
sourcing that the revenue screens put under the same header. Leave that comment
in place.

---

## 5. Return orders are missing from the overview

**Evidence:** the reference's `Orders and Quotes` grid holds 2 041 orders, 43
**return orders** and 6 quotes in one list, distinguished by the letter on the
number (`O`, `R`, `Q`).

`app/(dashboard)/orders-and-quotes/actions.ts` queries `Orders` and `Quotes`
only. `ReturnOrders` exists as a table and never reaches this screen.

**Change:** add the third source, and carry a document-kind so the row can show
its prefix. Returns come through with **negative** revenue, weight and profit —
which makes item 2 a prerequisite, or every return on this screen will show an
inverted margin.

---

## 6. `Representative` has no column

**Evidence:** four values on 2 091 rows — `Hego` (2 082), `Export` (4),
`Arian Bloks` (3), `BNL` (2). It is not the seller: `O101734` is represented by
`Arian Bloks` and sold by `André van der Veen`.

**Change:** a nullable `representative` on `Orders` (and `Quotes`). ⚪ **Hold
until C-part.** `Overviews → Customers` is 15 unopened screens, and if the
representative is a property of the *customer* that the order copies, the column
belongs there first. Four values is not enough to tell.

---

## 7. `orderMethods` carries four values the reference has never used

**Evidence:** across 2 091 rows the reference uses `Telephone` (1 190),
`E-Mail` (719), `Counter` (12), `Oral` (1), and leaves it blank on 169.

```ts
// lib/enums.ts:1244
export const orderMethods = [
  "telephone", "email", "counter",
  "representative",   // ← never seen
  "oral",
  "website",          // ← never seen
  "edi",              // ← never seen
  "ai_read_email",    // ← never seen
];
```

**Change: none yet — a note.** Four unused values is exactly the shape of a
feature that is switched off rather than absent, and the standing rule cuts the
other way here: blank *cells* are evidence, missing *enum members* are not. The
dropdown itself has never been photographed. **Add it to the B-part capture:**
open any order, open the `Order method` dropdown, 📸 it. That settles the list
in one picture.

Confirmed either way: the column is **nullable** — blank on all 43 return
orders, 125 orders and one quote.

---

---

## 8. 🔴 A line carries **two price units**, and we store one

**Evidence:** [order-lines.md](order-lines.md) §1 — 841 of 4 975 lines are sold
in a unit the product is not held in, and the conversion reproduces on **all
841** with no exceptions.

`OrderItems` has `priceUnit` and `netPrice`. The reference has **four** fields:
`PriceU` + `Net price (PriceU)` (what the customer is billed in) and
`Product PriceU.` + `Net price (ProdPriceU)` (the same price restated in the
product's unit).

**Change:** add the product-unit pair, and derive it rather than typing it:

```
weight per piece = weightKg / quantity
netPriceProductUnit = netPrice / (weight per piece, in the product's unit)
```

Without it the margin-against-`APP` columns cannot be computed at all — `APP` is
quoted per product unit and the net price is not.

⚠️ **Do not copy `Price -/- Cost price`.** The reference computes it as
`Net price (ProdPriceU) − Cost price` while the cost is per *line* unit
([order-lines.md](order-lines.md) §4) — it subtracts €/piece from €/tonne on
those same 841 rows. Convert first.

---

## 9. 🔴 `Amount` and `Profit` are unit-dependent and we have no helper

**Evidence:** [order-lines.md](order-lines.md) §2–§3, and again on the options
screen ([sales-options-and-calloff.md](sales-options-and-calloff.md) §3) with a
sixth unit.

```
basis(TN) = weightKg / 1000      basis(ST) = quantity
basis(KG) = weightKg             basis(M1) = quantity * lengthMm / 1000
basis(HK) = weightKg / 100       basis(M2) = quantity * (lengthMm/1000) * (widthMm/1000)

Amount = basis(priceUnit) * netPrice
Profit = Amount - costPrice * basis(priceUnit)     <- the LINE's unit, not the product's
```

Exact on 4 571 of 4 975 order lines (all of `ST`, `M1`, `HK`) and on **2 856 of
2 856** option rows. Profit lands within €0.50 on 98.5 % — the residual is the
displayed cost price being rounded to two decimals.

**Change:** one `lineBasis(unit, { quantity, weightKg, lengthMm, widthMm })`
helper in `lib/helpers.ts`, used by both amount and profit. Today the unit is a
`varchar` that decides nothing — exactly the shape the standing rule forbids.

⚠️ The 404 rows that miss are almost all `Invoiced`, and the implied weight is
the **delivered** weight rather than the line's. Model the order-stage formula;
treat the invoiced amount as its own stored value.

---

## 10. 🔴 There are **three** status ladders and we model one and a half

**Evidence:** [deliveries.md](deliveries.md) §4–§5.

| Ladder | Where | Values | Ours |
| --- | --- | --- | --- |
| `Line status` | order line | 9, plus `Expired` and `830` | `orderLineStatuses`, 9, two wrong |
| `Delivery status` | delivery line | 9, incl. `Ready`, `New`, `Workorders created` | `deliveryStatuses`, **4** |
| `Transport status` | the trip | 6: New, Scheduled, Loading list, Loaded, Loading done, Completed | — |

**Change:**

- `orderLineStatuses` — add `completed` and `received`; `delivered` and
  `cancelled` never appear.
- `deliveryStatuses` — replace the four with the nine. `not_ready` is an
  invention; `New`, `Workorders created`, `In progress`, `Partially delivered`,
  `Completed`, `Invoiced` and `Expired` are missing.
- Add a transport-status enum, wired to the trip rather than the line.

And keep the **numeric codes**
([sales-options-and-calloff.md](sales-options-and-calloff.md) §5): `010`
Provisional, `210` Released, `310` In progress, `610` Partially delivered, `805`
Partially invoiced, `810` Invoiced, `830` **unknown and hidden from the
`Order lines` screen**. The reference numbers in hundreds so states can be
inserted, and two screens print the number instead of the word.

**Then wire the blocking rule:** a `Transport blockage` line **never** has a trip
number — 895 blocked, 895 without; 4 297 unblocked, all with. Zero exceptions in
6 134 rows. That is a hard constraint, not a convention.

---

## 11. 🔴 An invoice line is one of two kinds, and money splits three ways

**Evidence:** [invoice-lines.md](invoice-lines.md) §1–§2.

```
Linetype = Orderline | Surcharge                     5 180 / 470
Revenue line = Revenue products + Revenue options    0 mismatches / 5 650
Profit line  = Profit products  + Profit options     0 mismatches / 5 650
```

A `Surcharge` line has **no order line** and is quantified in **euros**.

**Change:** a line-kind discriminator on the invoice line, and the
products/options split on revenue and profit. The same split already exists on
the delivery line as `Invoiced (Prod.)` / `Invoiced (Opt.)`.

⚠️ **And stop sharing the margin helper.** Four screens, four conventions
([invoice-lines.md](invoice-lines.md) §3): the header rounds to 1 dp, the order
line does not round, invoice `products` rounds to 1 dp, invoice `line` rounds to
2 dp **and uses a signed denominator**. Store unrounded; round per screen.

---

## 12. Contract groups have **two** levels

**Evidence:** [contracts.md](contracts.md), the Contractgroups screenshot —
`Main group` + `Main group Sequence` + `Subgroup` + `Subgroup Sequence`.

`ContractGroups` carries `contractSubgroupUuid` and `sequenceWithinSubgroup`:
one level, one sequence. The reference puts `Certificates` / `Production` /
`Packaging` above `Certificate costs` / `Internal production` / `Pallet costs`.

**Change:** add the main-group level and its sequence. Small, and only three
rows of evidence — but the shape is unambiguous.

⚪ Everything else on those two screens **already matches**: `contractTypes`
holds all six values (three in use), `searchCode1/2/3` exist, and
`websiteSorting` defaults to 10, which is what nine of the ten contracts carry.

---

## 13. Freight is a **weight-bracket × zone** tariff

**Evidence:** [charges.md](charges.md) §3.

`External transport` is priced from a band table — `0–2000`, `2001–3000`,
`3001–4000`, `4001–5000`, `5001–7000`, `7001–10000`, `10001–15000`,
`15001–20000` — with about eight price points inside each band, one per
destination zone. `Region` is the zone axis.

Two sentinels to recognise, not to model as bands: `0–125` means “no band” (every
non-freight surcharge uses it) and `0–999999` means unbounded.

**Change:** ⚪ **hold.** The bracket structure is clear but the zone axis is not
— 16 regions against 8 price points means the mapping is many-to-one and this
export does not show it. The tariff table itself is a screen nobody has opened.
**Add to the capture list:** find where the freight tariff is maintained (likely
under `Extra`, item A1) and photograph it.

⚠️ A surcharge is not always in euros: `Decoil surcharge` and `Cutting
surcharge` are per **tonne** and post to the 3000 processing band, not the 8000
surcharge band.

---

## 14. 🔴 VAT, invoice type and payment terms — the header settles all three

**Evidence:** [invoice-lines.md](invoice-lines.md) Part 2, 1 683 invoices.

- **VAT**: 21 % domestic, 0 % everywhere else. 1 128 of 1 141 Dutch invoices and
  524 zero-rated in total, with per-invoice exceptions both ways. `vatCodes`
  exists in `lib/enums.ts` and **drives nothing** — wire it to the customer's
  country with an override, and store the VAT amount on the invoice header.
- **`Type`**: `Debit` / `Credit` / `Surcharge` / `Correction`. A credit note is
  a whole document with a negative amount, not a negative line. `Surcharge`
  invoices have no order behind them (135 rows with `Order = 0`).
- **Payment terms**: 20 codes, and **531 invoices (32 %) carry an early-payment
  discount** — 1 %–3 % for paying inside 8–14 days. We model none of it. The
  code is not always numeric (`V` prepayment, `C` cash, `998` settlement), so
  `Expiration date` must be **stored**, not computed from the code.
- **`Outstanding amount` always equals the invoice amount** on all 482 open
  invoices — no partial payment is recorded. €3 370 533.15 open.

⚪ Confirmed off: `Credit restriction` is `0` on all 1 683.

---

## 15. 🔴 A return is a **complaint's** consequence, and may move no metal

**Evidence:** [returns-and-complaints.md](returns-and-complaints.md), 88 lines.

- A **sixth number series**, `K40000`–`K40069`, with a date and a free-text
  description. Nothing in `apps/dashboard` records why a return exists.
- **`Return reason`** is a closed five-value list — check `returnOrderReasons`
  against it.
- The reversal link is **per line**: `Original order` + `Original order line`,
  filled on 83 of 88. `ReturnOrderItems` needs `originalOrderItemUuid`.
- ⚠️ **`Return Qty = 0` on 16 lines** while the accounting quantity is
  negative. One description spells it out: *"retourboeken (niet werkelijk
  terughalen) crediteren"* — book the return, do not collect, credit it. Three
  more complaints are pure billing corrections. **A return that credits money
  without moving stock must not create a stock movement**, or every billing
  correction invents metal.

---

## 16. `Main group` and `Revenue group` are two axes, not one

**Evidence:** [product-prices.md](product-prices.md) §2, 19 383 products.

1 450 products whose `Main group` is `Steel` post to the `Aluminium` revenue
group; 837 post to `High Alloys`; 112 stainless products post to `Aluminium`.

**Change:** keep the material hierarchy (`Main group` → `Subgroup` → group
product → product) and the revenue group as **independent** columns. Deriving
one from the other reproduces the reference on 12 268 of 19 383 rows and
silently mis-posts the other 7 115.

⚪ Also confirmed: `Stock product` and `Standard product` are the **same value**
on all 19 383 rows. Model one.

# ⚪ Questions this export raised

- ~~**What is `B250000`?**~~ ✅ **answered by B8.** The Charges screen types it
  `Counter order` — a walk-in sale. The four sales series are `O` order, `R`
  return, `B` counter order, `Q` quote.
- 🔴 **What is line status `830`?** Two lines carry it and the `Order lines`
  screen hides both. One screenshot of the line-status dropdown settles it.
- 🔴 **What is `Order type` = `DEF`** on every quote line? A vocabulary that
  appears on no other screen.
- **Why is `Q300000` missing from `Orders and Quotes`?** Its line is in B6; its
  header is not in B1, while other `Expired` quotes are.
- **Why do `O102166`–`O102169` each appear twice?** Identical in 37 of 40
  columns; they differ only in `Creation date`, and the second row of all four
  carries the same timestamp to the second (2026-09-09 11:16:26). Four orders
  were re-stamped in one action without new numbers.
- **Does `cancelled` exist at all?** The reference has no cancelled status and
  154 gaps in its order-number series. It may simply delete.

# ⚪ Confirmed switched off

Blank on **every one of 2 091 rows** — the features exist and are unused:
`Pick-up slip`, `Converted from/to`, `Last follow-up`, `Last follow-up reason`,
`Internal Text`, `Classification code`, `Classification`. Add `Decision date`
and `Last follow-up date`, which are `0` on every row including all six quotes.

⚠️ `Converted from/to` is the weak one — only six quotes exist in the whole
database, so its emptiness says nobody has converted one, not that the product
cannot.
