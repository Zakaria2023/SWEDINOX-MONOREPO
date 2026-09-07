# Answered

Everything your checks have already settled, so nothing gets asked twice.
[STEPS.md](STEPS.md) holds only what is still **open** — when an item there is
answered it moves here.

Grouped by subject. Each entry says what is now known and, where it matters,
what changed in the code because of it.

---

## The product hierarchy

- **It is one tree, four levels deep, linked by the "Material group" field.**
  `5080` Aluminum → `ALUP` Aluminium plates → `50801070` Aluminium plate
  semi-rigid 1S → `6010040315`. Groups and products are the same entity there;
  two tables here.
  [see](purchase/sold-products-not-advised.md#answered)
- **`Main group` is the root; `Product group` and `Subgroup` are both the level
  directly above the product.** Level 2 is skipped in every display. Read off
  the Purchase results export's own Main group / Subgroup / Product triples.
  [see](purchase/purchase-results.md)
- **"Classification features → Product group" is the product's *shape***
  (`Plaat`), greyed out, and has nothing to do with the hierarchy. The
  reference uses the phrase "product group" for two different things.

## Order advice

- **Settled outright** by a 5,535-row export of both views, kept in
  [`exports/`](exports/). Every formula on the screen is proved: the ÷12 / ÷24
  / ÷36 consumption windows, the min/max rounding, both coverages, the advice
  rule, and the fact that the engine runs in **purchase units**, not kilos.
  "To be received long term", "Not reserved call-off", "Consign.", "Order
  advice code" and "PAC-Code" are unused on every row.
  [see](purchase/order-advice.md)
- **And verified, not just matched**: the export was seeded into our own
  database, the real Server Action driven against it, and all six checkable
  columns agree on **262 of 262** rows — the same two products advised, at the
  same quantities. Two logic bugs fell out of that and are fixed:
  - the position is held **natively in purchase units**, never converted from a
    weight, which is how the reference prints a stock for a product whose
    weight per piece is blank;
  - coverage divides by the **printed** average, rounded to one decimal —
    `489 / 0,9 = 543,3`, not `489 / (11/12) = 533,5`.
- **"Avg. Monthly consumption last year"** — trailing 12 months, divided by 12.
  [see](QUESTIONS.md)
- **Consumption is counted from invoices**, not deliveries or stock movements.
- **"Reserved" is in the purchase unit, not kilos.**
  [see](purchase/order-advice.md)
- **"To be received short term" excludes the reserved part of an open line.**
- **The purchasing unit list has eight values, not two.**
- **`Available = Technical − Reserved`**, in the unit and in kilos. Proved on
  Order advice and again, independently, on the purchase order's own `Stock`
  panel.
  [see](purchase/purchase-order-detail.md#stock)

## Sold products not on the order recommendation

- **"Revenue" is money; "Sales" is a weight in kilograms.**
- **Consumption counts stock units ÷ 12** while the `Sales` column beside it is
  kilograms. Proved on `SC304`, stocked in KG, where
  `45,22865 / 12 = 3,76905416666667` to the last decimal, and on the coil
  products, whose consumption is a small whole number of coils over twelve.
- **"Standard product" is greyed out**, so the system derives it.
- **Verified**, the same way Order advice was: its 175-row export seeded and
  diffed against our screen — **175 of 175 on all eight checkable columns**,
  and exactly 175 rows returned, so none of the 5,398 Order-advice products
  leak in.
  [see](purchase/sold-products-not-advised.md#verified-against-the-reference)

## Which products get an order advice

- **"Making order advices" is a property of the product, not of its group.**
  The two exports share 20 groups but not a single product code, and 83
  products sit on Sold products while a sibling **in the same group**, equally
  a stock product, sits on Order advice — `CAA1050020` excluded where
  `CAA1050030` is included. Both screens now read
  `Products.makingOrderAdvices`; the group keeps its copy as a default for the
  form. The column already existed on both tables, so no schema change was
  needed.

## How weight is calculated — the formula behind every kilo column

**`weight per piece = length × width × thickness × density`.** The product
master gives `PK316L40021` as 2000 × 1000 × 4,00 mm at **7.850,000 KG/M3**, and
`2 × 1 × 0,004 × 7850 = 62,800 kg`. That one formula reproduces every per-piece
weight derived anywhere else, to three decimals:

| Product | Thickness | Calculated | Observed | Where the observation came from |
|---|---|---|---|---|
| `PK304L20021` | 2,00 mm | 31,400 | 31,400 | `Price quantity ÷ Qty(p)`, receivals export |
| `PK304L15021` | 1,50 mm | 23,550 | 23,550 | `Kg(p) ÷ Qty(p)`, order `400253` line 10 |
| `PK304L15021` | 1,50 mm | 23,550 | 23,550 | all four `Previous orders` lines |

So for a **dimensioned** product weight is **derived**, not stored, and every
kilo column upstream — receivals `Kg(p)`, the order's `Kg(p)`, the invoice's
`Kg`, `Price quantity` — is that number times a quantity.
[see](product-detail.md#-the-weight-formula-proved)

⚠️ **Qualified:** a `Stuksartikel` (*piece article*) has **no dimensions** and
its `Weight` field holds **Kg/Psc** — a weight per piece, stored directly. The
product master's `Basis` panel is a different shape per product type. So our
schema needs both paths.

**There are three densities**, not one: `Theoretically` 7.850, `Trade` 8.000
and `German` 0. Trade is a 1,91 % commercial rounding. It does **not** explain
the over-billing on the order's Previous orders panel (4 pieces would be 96,0 kg
at trade density and 100,0 is billed), so that remains open — but trade weight
is ruled out, which narrows it to surcharges.

## Purchase results

- **`Replacement value` is zero on all 1,800 rows**, so both difference columns
  are dead and the percentage cannot be reconstructed.
  [see](purchase/purchase-results.md)
- **One row per receipt line — no aggregation at all.** 1,800 rows cover only
  466 distinct (Subgroup, Receipt date) pairs, and `Cold-rolled plate 304` on
  `2025-03-10` alone produces **29 rows with 29 different purchase values**.
  So a line received in two goes appears **twice**, and `Purchase value` is
  that receipt's own cost.
- **`Year` and `Month` are derived** from `Receipt date` — they agree on
  1,800 of 1,800 rows, so they exist only for grouping and ours computes them.
- ~~The screen aggregates at the subgroup.~~ **Revised** — it does not, and
  `Product` genuinely differs from `Subgroup` on 32 of the 1,800 rows
  (`Stainless steel coils` against `Coil Cold-rolled 439`). It is a real level
  below that usually carries the same name.

## Purchase invoices

Answered by the detail screen of invoice `600000`, Quarto Deutschland Gmbh.
[see](purchase/purchase-invoices.md)

- **`Invoice amount` is net.** `Materials` 7 881,60 → `Tot. excl. VAT`
  7 881,60 → VAT 0,00 → `Tot. incl. VAT` 7 881,60. The total is net plus VAT.
- **The lines reconcile to the cent, and confirm the price-unit model a third
  time.** A `Per` column holds the price basis (`TN`), and
  `Material = price × weight ÷ 1000`: `2800 × 0,800 = 2240,00`,
  `4350 × 0,576 = 2505,60`, `2800 × 1,120 = 3136,00` — summing to the header's
  7 881,60. `Total = Material + Options`.
- **The dates are settled.** `Booking date` is not a date but a mode, reading
  **`Automatically`**, and `Basis for Fiscal Period` is a radio between
  `Booking date` and `Document date` — exactly our
  `purchaseInvoiceFiscalBases` enum. So `Booking period` on the overview is
  **derived**, not stored.
- **`Credit restriction` is a real amount**, with its own line in the summary
  between `Tot. incl. VAT` and `Tot. general`. It is €0,00 here, so the
  percentage behind it is still unread.
- **Blocking is separate from status**: the header carries `Blocked` ☐ and
  `Blocking reason` alongside a status of `Released`.
- **The status is audited** — *"Invoice status was last changed by Raymond
  Wattez on 22-1-2025 at 12:08"* — so who and when are stored.
- **There are three VAT buckets**, `VAT high` / `VAT middle` / `VAT low`, not
  one rate.
- **`Invoice sent by` is a second company field**, so an invoice can arrive
  from someone other than the supplier.

## The company master

[see](company-detail.md)

- **A company holds nine role checkboxes, not one role**: Customer, Prospect,
  Supplier, Processor, Transporter, Agent, Purchasing org., Other, Internal.
  Quarto is **both a customer and a supplier**, so a role is a set rather than
  a single value.
- **Three identities on one company** — `Company code` 12804 (trading),
  `Creditor` 50988 (payables), `Debtor number` 12088 (receivables). This
  answers the "three ways to identify a supplier" question: they are a ledger
  account and a trading code, not duplicates.
- **Creditor and debtor carry independent payment terms and journal codes** —
  30 days when we buy, `Prepayment` when we sell; journal `0` against `11`.
  So payment terms belong to the role, not the company.
- **"Open" means `Released` + `Provisional`.** The `Purchase orders` panel
  header reads `3 open purchase order(s); € 14.115,48; 4808,2 Kg`, and
  `2 340,48 + 11 775,00 + 0 = 14 115,48` with `883,2 + 3 925 + 0 = 4 808,2` —
  exact on both, with the Provisional order contributing nothing but the count.
- **`1-1-0001` and `31-12-9999` are null sentinels** — *never* and *forever*.
  They appear in `Confirmation date`, `Oldest invoice date open entrees` and
  `Insurance valid until`. Both must render blank in ours and neither should be
  stored.
- **`Main language` is per company**, so documents print in the customer's
  language.
- Panel headers carry a **summary while collapsed** (`0 contracts`,
  `0 open purchase quote(s); € 0,00; 0 Kg`) — a pattern worth copying.

## The product master

[see](product-detail.md)

- **`Commodity` is the customs/HS code** — `72193210` on `PK316L40021`. That
  is the CBS/commodity field Purchase invoice line was asking about.
- **`Options` is a fixed enum with per-product availability**: Duplo,
  Decoilen, Grinding, Brushing, ShearCut, Laser Foil, each reading `Possible`.
  This is the list behind the `Options` column on Purchase receivals. The
  reference is inconsistent with itself — `Grinding`/`Brushing` here print as
  `Slijpen`/`Borstelen` there, and `Laser Foil` as `Laser Folie`.
- **`Material group` is greyed** and reads the parent group's name, confirming
  a third time that the hierarchy is linked by that field and derived rather
  than picked.
- **`Classification features → Product group` is the shape** (`Plaat`), greyed
  — a third independent confirmation. It sits in an eight-facet classification
  beside the hierarchy, of which only `Product group`, `Material` and
  `Procedure` are populated.
- **A product's display name is assembled** from the group's short description
  plus the product's own dimension string (`Cold-rolled plate 316L` +
  `2000x1000x4mm`), which is why the exports print a group-ish `Product` name
  and carry dimensions separately.
- **`Fixed dimensions` ☑** marks a stocked standard size rather than
  cut-to-order, deciding whether length and width are editable on a line.

## Purchase receivals

All seven of this screen's questions, answered by a 151-row export plus the
detail screen of order `400253`. Full working in
[purchase-receivals.md](purchase/purchase-receivals.md).

- **One row per *receival*, not per purchase line.** 151 rows cover 107 lines;
  22 lines appear more than once, up to 7 times. Exactly four columns vary
  between the rows of one line — `Kg(p)`, `Kg(a)`, `Delivery date (a)`,
  `Receipt status` — and the other 21 repeat from the line. A receival is a
  **weight instalment**, and the instalments sum to the line: order `401076`
  line `10` splits 1 224,6 kg into 471 + 251,2 + 219,8 + 282,6.
  The mechanism is the `Split` button on the order's `Receipts` panel.
- **`Qty(a)` is the quantity received so far** — `0` on all 96
  Provisional/In-progress/Released rows, `= Qty(p)` on all 46
  Received/Invoiced rows, strictly between on all 9 Partially received.
- **`Received Qty` is a committed quantity, not a receipt.** It is non-zero on
  67 rows where nothing has arrived, and zero on exactly the 20 Provisional and
  In-progress rows. So the old guess — that one column is per-row and the other
  cumulative — was **wrong**; the split lives in `Kg(p)` alone.
- **A "gross price unit" is the weight unit the price is struck in**, and it is
  not the purchase unit. `Line amount ÷ Price quantity` is a round figure on
  **64 of 64** priced lines. It is the tonne on 104 of 107 lines and 100 kg on
  the other three. The order detail prints it outright: `€ 1.950,00 per TN`.
  So `Line amount` = net price per tonne × the line's weight in tonnes —
  reconciled to the cent on both lines of `400253` that appear in the export.
- **`Price quantity` is restated to the *actual* weight once a line is fully
  received** — `401085/10` reads 154,0 where planned was 157,0; `401127/10`
  reads 693,3 where planned was 706,6.
- **`Invoiced (Prod.)` is the same field as `Price quantity`**, identical on all
  151 rows including the 17 Provisional ones that cannot have been invoiced. It
  is also **not money**, despite the `€ 0,35` mask — the value is `0,3454`.
- **`Line status` and `Receipt status` are genuinely different fields.** Line
  status is the line's lifecycle (Provisional → In progress → Released →
  Partially received → Received → Invoiced); receipt status belongs to the
  instalment (New, Released, Workorders created, Received, Invoiced). Proof:
  on `Partially received` lines the arrived instalments read `Received` and the
  outstanding ones read `Released`, on the same line.
- **The filter is on the planned date.** With the range set to
  `7-9-2025 … 7-9-2026`, `Delivery date (p)` is inside it on all 151 rows,
  while `Delivery date (a)` falls outside on 100 and `Purchase order date` on
  25.
- **`Receipt date` is derived**: it equals `Delivery date (a)` on all 51 arrived
  rows and `Delivery date (p)` otherwise. `Delivery date (a)` and `Kg(a)` are
  filled together or not at all — 51 both, 100 neither, zero one without the
  other.
- **`Company code`/`Company name` are the supplier** — Aperam, Terninox,
  HW-Inox, Holland Stainless.
- **The four unlabelled headers are** order code, line code, supplier code and
  supplier name; the export names the fields even though the grid shows no
  caption. We choose our own captions, so this no longer blocks anything.
- **`Length = 999999` means coil**, confirmed against the order line
  `CK304L0015`, *Coil Cold-rolled*. Render it blank, not as a number.
- **`Options` is a comma-separated list of processing steps**, in Dutch:
  Decoilen → Decoiling, Slijpen (K320) → Grinding (K320), Laser Folie → Laser
  film, Borstelen → Brushing, Knippen → Cutting, ShearCut.

## Stock on location

[see](stock-on-location.md)

- **"Sold" is exactly "reserved".** The `Verkocht` view (`Reserved > 0,01`)
  totals 495 180 kg and `Beschikbare voorraad` (`Reserved = 0,00`) totals
  1 933 295 kg, against a full total of 2 428 474 — one kilo out from rounding.
  The two views **partition the whole stock**, so `reservedQuantity > 0` is the
  entire definition of sold and no status field is needed.
- **`Stock (€) = Stock (Kg) × Valuation price ÷ 1000`** — exact on 8 of 8 rows,
  so the valuation price is **per tonne** like every other price in the system.
- **`Available = round(Stock − Reserved)`**, half-up to whole units, on 15 of 15
  rows — and it rounds **kilograms** too when the stock unit is KG. A display
  rounding of a stored decimal; ours keeps the decimal and rounds on render.
- **`Stock (Kg)` is the density formula again** — 10 of 10 rows, the fifth
  screen to confirm `length × width × thickness × density` and the first on the
  stock side.
- **Material at an external processor is blocked.** Nearly every lot in the
  `Bewerkers` (*processors*) location has `Blocked` ☑, while `Ontvangst`
  (*goods-in*) lots are not — so leaving the building for processing blocks the
  lot from sale. That is what `control-stock-increase-external-processing`
  reconciles.
- **Stock corrections are booked as a purchase** from a pseudo-supplier,
  `Hego Voorraadcorrectie`. So every lot has a supplier even when nobody sold
  it to us, and the supplier list includes internal entities — which is what the
  company master's `Internal` role checkbox is for.
- **`Stock category` is an enum**: `2nd choice` · `Scrap` · `Remaining` ·
  blank.
- **`Charge` is the mill heat number** (free text, `nvt` = *n/a*);
  **`Internal charge` is ours**, formatted as a 2-digit year plus four
  characters (`25ADKI`, `26ADQT`).
- **The `IO` prefix is confirmed as the purchase-order series** — `IO400874`
  here, `IO400166` on the purchase invoice.
- 🚩 **One lot has a negative valuation price** (−€1 688,83/t, giving −€303,99
  of stock value). The formula still holds; the data is wrong.
- ⚠️ The `Product code` filter's upper bound defaults to the string sentinel
  **`zzzzzzzzzzzzzzz`**. Ours uses an empty field.

## Purchase quotes

[see](purchase/purchase-quotes.md)

- 🚩 **The screen has at most one row in three years, and it is a mistake.**
  Filtered `7-9-2023 … 7-9-2026` it returns a single line: product `Offerte`
  (*quote*), every money field € 0,00, status `Expired`, reason
  **`Incorrectly entered`**. ⚠️ A re-run with `from` left blank returned
  **zero** rows — fewer, so the blank voided the filter rather than widening it;
  the count is an upper bound, not a proof of emptiness.
- ⚖️ **Decision: the screen stays** as a read-only table, unlike Import
  purchase invoices which was removed. Its remaining questions moved to
  [MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) and are no longer steps.
- **The quote header is the same layout as the purchase order's**, plus a
  `Quote` block (`Quote No`, `Quote date`, `Valid u/i`) and a `Follow-up`
  block whose `Expired because` **is** the overview's `Expiration reason`.
- **The discount model is complete.** The line grid carries `Gross Price`,
  `Line Discount` and `Group Discount` — both percentages, each with its own
  `%` unit column — beside `Net Price`. So
  `Net = Gross − Group % − Line %`, and `Amount = Net × weight` in the price's
  own unit. That closes the chain glimpsed on the order's Previous orders panel.
- **`Company code` is the supplier's** — `11692` is Holland Stainless Int on
  the same row, not a branch.
- **`Length`/`Width` are millimetres**; the overview omits the unit but the
  detail grid prints `0 mm`.
- **`Initials purchaser` and `Purchaser` agree** (`BV` / `Benno Vos`), so
  store one field.
- **`Consignation` is a checkbox**, unticked on the only row — which is why the
  consignment-stock question has to be answered from a purchase order instead.
- **`Revenue group` adds `2900 = Other products`** to Purchase lines'
  `1000 = SS 304`, `1100 = SS 316`, `1300 = SS 430`.
- **`Purchase order type` is the same two-dropdown pair** as on the order
  (`Materials` + `-empty-`) — a third sighting.

## Verified live, by creating records

A test quote and its converted order were built on the `HEGO TEST` affiliate.
[see](purchase/purchase-quotes.md#-verified-live-by-creating-a-quote)

- **Three formulas confirmed on a record made in front of us**: `Kg(p)` = 314
  for 10 × 31,4 (density), `Amount` = € 606,02 for `1 930 × 0,314` (price ×
  weight in the price's own unit), and `Total weight` = the line's kilos.
- **`VAT high` is 21 %** — `606,02 × 0,21 = 127,26`, the Dutch standard rate.
- **`Options` is its own table**, not columns on the line: `Seq.` · `Option` ·
  `Qty` · `U` · `Gross price` · **`Per`** · `Discount` · `U` · `Amount` ·
  `Reference factor` · `Net price` · `Specificatie`.
- **`Per` = `M2` on a Grinding option**, so the pricing basis is a **field per
  option row** — confirming structurally what the Purchase lines arithmetic
  implied (surface treatments per m², decoiling per tonne).
- **`Consignation` is a header field, not a line field** — spelled
  **`Consignatie`**, under `Overlength`.
- **Converting a quote gives a `Provisional` order** whose header prints
  **`Converted from quote 900000`** — a stored link, not a note. Quotes are a
  9-series, orders a 4-series.
- **`Make final` and `Confirm` appear on a provisional order** and not on a
  released one; `Confirm` is what sets `Qty confirmed`.
- **`M1(p)` is running metres** — 20 for 10 pieces of 2 000 mm.
- **`APP` is a price per tonne** (`2050 / TN` in the product-search dialog), so
  Stock on location's `Change APP…` is a price action.
- ⚠️ **`Consignatie` does not exist on the purchase order header.** That is now
  the open half of the consignment question.

## Purchase lines

Nine saved views were captured, including `-empty-`, giving the full ~50-column
palette. [see](purchase/purchase-lines.md)

- ~~Purchase lines shows "Purchase order type" twice — one field, not two.~~
  **Revised twice, now settled.** The `-empty-` view shows two distinct
  columns sharing the caption: one holds the **document kind** (`Purchase
  order`) and the other holds `Materials` / `Processing`. The order detail's
  two stacked dropdowns are these two.
- **`Amount(p)` = price × weight in the price's own unit**, exact on 11 of 11
  rows — a `TN` price divides the weight by 1 000, a `KG` price does not, and
  the `PriceU` column decides which.
- **`Kg(pur)` is a rounded display.** Three rows only reconcile against the
  exact `length × width × thickness × density` weight: 565,20 shown as 565
  (€1 740,82 ✓), 3 532,50 as 3 533 (€7 065,00 ✓), 1 381,60 as 1 382
  (€4 835,60 ✓). Fourth screen to confirm the density formula.
- **`Available` on a purchase line = `Qty(p) − Qty(a) − Reserved`**, clamped at
  zero, in both units — 7 of 7 rows. This is **not** the warehouse's
  `Technical − Reserved`; both exist and mean different things.
- **`Kg. still to be received = Kg(pur) − Kg(a)`**, and `Amount yet to be
  received` is the price times that: `1 930 × 0,0474 = 91,48` and
  `2 490 × 1,103 = 2 745,47`, both exact.
- **`Qty ordered` and `Qty confirmed` are process flags**, each either `0` or
  the full line quantity and independent of each other. **This settles
  `Received Qty` on Purchase receivals** — it is `Qty confirmed`, which is why
  it is non-zero where nothing has arrived.
- **`Status` is line-level and has at least seven values**: Provisional → In
  progress → Released → **Checked** → Partially received → Received → Invoiced.
  Order `400253` has line 40 `Partially received` beside line 50 `Released`.
- **`Line type` is `Stk` or `CD`** — for stock, or a direct delivery matching
  the order header's `Pick up/Drop-off CD-purchases` checkbox.
- **`Receipt date` is planned, and often overdue** — rows dated 29-4-2025 still
  read `Released` with the system date at 7-9-2026.
- **`Company code` is the supplier's code** (`10631` = Aperam Service), not a
  branch or affiliate.
- **`Purchase Reference` is free text** — `Test 1`, `knippen`, `tbv Knake`,
  `K250147861`. A few resemble order numbers but most do not, so it cannot be
  treated as a link.
- **`Thickness` is a decimal** (`2,057`, `1,52`, `0,99`, `4,97`) where
  `Length` and `Width` are whole millimetres.
- **`Revenue group` is a grade family with a code**: `1000` = SS 304,
  `1100` = SS 316, `1300` = SS 430.
- **`Stock Category`** takes one observed value, `2nd choice`, blank otherwise
  — it flags off-spec material. **`Quality Code`** is the product's quality
  plus finish (`304L2B`, `430BA`), joined in from the product master.
- **`Margin (€ per gross unit)` is dead.** `Current gross price` is €0,00 on
  every visible row, making margin exactly minus the net purchase price on all
  10 rows checked. Same shape as `Replacement value` on Purchase results.
- ⚠️ **The footer sums `Net Purchase Price`** — adding prices per tonne across
  544 lines. Ours sums weights and amounts only. It also mixes languages, three
  `SUM=` labels against one `Som=`.

## Processing options — bought as lines, priced two ways

Options are not surcharge fields; they are **service lines with their own
product codes**, carrying `Qty(p) = 0` and `Kg = 0` against a parent material
line. Codes seen: `D` (Decoilen), `SL` (Grinding/*Slijpen*), `BF` (Blue
Foil/*Blauwe Folie*), `LSR` (Laser), `K` (*Knippen*), `ShearCut`.

Both pricing bases are proved to the cent on order `400904` (1,25 mm plate):

| Option | Price | Basis | Check |
|---|---|---|---|
| Blue Foil | € 1,40 | **per m²** | `2,2 × 1,0 × 28 = 61,60 m² → €86,24` ✓ |
| Grinding | € 1,70 | per m² | `107,50 m² × 1,70 → €182,75` ✓ |
| Decoilen | € 110,00 | **per tonne** | `1,0548 t × 110 → €116,03` (shown 116,04) ✓ |

Surface treatments bill by **area**, decoiling by **weight**, and both take
their measure from the parent line's dimensions × quantity. This is the likely
explanation for the over-billing on the order's Previous orders panel.
[see](purchase/purchase-lines.md#-processing-options-are-purchased-as-their-own-lines)

## Out of scope

- **Import purchase invoices is removed entirely.** Purchase invoices do not
  arrive electronically in the reference install, so the screen sits unused.
  The route, its components, its sidebar entry, its doc and all four of its
  steps are gone.

  ⚠️ One loose end: the `ImportedPurchaseInvoices` table still exists in
  `db/schema/integrations.ts` and in the database. Nothing reads it now.
  `integrations.ts` itself must stay — `sigmanest-blocked-orders` uses it —
  so only that one table would be dropped, and dropping it needs a
  `pnpm db:push` that deletes a table.

## Capture status

All 12 Purchase screens are captured, plus three detail screens — the
[purchase order](purchase/purchase-order-detail.md), the
[company master](company-detail.md) and the
[product master](product-detail.md) — and one purchase invoice. No more
overviews to send for this group.

**Exports held** (in [`exports/`](exports/), gitignored): Order advice (both
views, 5,535 rows), Sold products (175), Purchase results (1,800), Purchase
receivals (151).
