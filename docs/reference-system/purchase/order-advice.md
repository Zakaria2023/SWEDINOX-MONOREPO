# Order advice

`Overviews → Purchase → Order advice`. Ours: `/order-advice`.

What to buy. For every stock product it compares the position against a stocking
policy and advises a purchase quantity.

**Filters**: `Product code` (from / to), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product · Supplier ·
Purchase… · Request quote… · Current purchase orders/quotes.
**View open when captured**: `besteladvies printver…` — a saved view. The
full column palette, seen with `View` set to `-empty-`, is inventoried below.

## Columns — matched

All 18, in the reference system's own order. Names below are its headings, taken
from the tooltip where the heading is truncated on screen.

| # | Reference heading | Our field | Where ours gets it |
|---|---|---|---|
| 1 | Product code | `productCode` | `Products.productCode` |
| 2 | Description | `description` | `Products.name` |
| 3 | Main group | `mainGroup` | root of the group hierarchy — `COALESCE(parent.name, group.name)` |
| 4 | Stock (Pur.U.) | `stockPurchaseUnit` | technical kg → purchase unit |
| 5 | Reserved (Pur.U.) | `reservedPurchaseUnit` | reserved kg → purchase unit |
| 6 | Available (Kg) | `availableKg` | technical kg − reserved kg (the subtraction stays in kilos) |
| 7 | To be received short term (Kg) | `toBeReceivedShortTermKg` | open purchase lines, `kgPurchased` pro-rated by what is still owed **and not reserved** |
| 8 | Econ. stock (Kg) | `economicStockKg` | available + to be received |
| 9 | Avg. Monthly consumption last year (Kg) | `avgMonthlyConsumptionLastYearKg` | invoiced `weightKg`, trailing 12 months ÷ 12 |
| 10 | Supplier | `supplierName` | preferred `ProductGroupSuppliers` → `Companies.companyName` |
| 11 | Consumption previous month (Kg) | `consumptionPreviousMonthKg` | invoiced `weightKg`, previous calendar month |
| 12 | Avg. Monthly consumption last 3 years (Kg) | `avgMonthlyConsumptionLast3YearsKg` | invoiced `weightKg`, trailing 36 months ÷ 36 |
| 13 | Advice Weight rounded | `adviceWeightRounded` | `max(0, maxStockKg − economicStockKg)` when below min, rounded to whole kg |
| 14 | Economic Coverage | `economicCoverage` | econ. stock ÷ avg monthly (last year) |
| 15 | Technical Coverage | `technicalCoverage` | technical ÷ avg monthly (last year) |
| 16 | Stock product | `stockProduct` | `Products.stockProduct` |
| 17 | Advice Qty. (Pur.U.) | `adviceQtyPurchaseUnit` | advice weight → purchase unit |
| 18 | OrderQty (Pur.U.) | `orderQtyPurchaseUnit` | advice qty rounded up to order series / MOQ |

**`Main group` is the root, not the product's own group** — corrected after
[Sold products](sold-products-not-advised.md) showed both levels of the
hierarchy side by side. A product sitting directly under `Aluminum` and one
sitting under `Aluminium coils A5754` both print `Aluminum` here.

**Dropped from ours**: `Min level` and `Max level` were columns we invented. They
are still computed — the advice needs them — but they are not shown, because the
reference system does not show them.

**The chain**, so the three advice columns cannot drift apart: the advice is
struck in kilos, rounded (→ 13), converted to the purchase unit (→ 17), then
rounded up to the supplier's series and minimum (→ 18).

## The full column set, with `View` set to `-empty-`

The 18 columns above are what the saved view `besteladvies printver…` shows.
Clearing the view to `-empty-` reveals the screen's whole palette — roughly
**74 columns**. That is not a different screen; it is the same query with
nothing hidden.

**This does not make the 18 wrong.** A saved view is a column layout somebody
in the business built and kept, so those 18 are the ones the buyers actually
look at. What the full set gives us is the **data model behind the screen** —
what the reference system knows about a product's position, and therefore what
ours has to be able to compute even when it does not print it.

Headings marked `…` were still truncated at full width; the reading is the
visible text.

### Identity and classification

| Reference heading | Ours | Notes |
|---|---|---|
| Main group | ✅ | root of the hierarchy |
| Product group | ➕ | second level — shown on Sold products, not in our Order advice |
| Product code | ✅ | |
| Description | ✅ | |
| Quality | ➕ | `A5005`, `A5754` — a material grade, sparsely filled |
| Revenue group number | ➕ | `1500` |
| Revenue group | ➕ | `Aluminium` |
| PAC-… | ➕ | the same PAC-Code as on Sold products |
| Order advice code | ➕ | empty on every captured row |
| Order advice notes | ➕ | free text, empty on every captured row |
| Stock product | ✅ | a tick |

### Conversion factors and units

| Reference heading | Ours | Notes |
|---|---|---|
| Theoretical Weight/Pcs. | ➕ | `Products.theoreticalWeight` — we hold it, we just don't show it |
| Purchase U. | ✅ | shown as a suffix on our columns rather than as its own column |
| U(replacement price) | ➕ | varies per row — `KG` on most, `TN` on some |

Every unit on this screen is its own column, and several of them differ row to
row. That is the same lesson as `Stock U.` on Sold products: the grid mixes
products counted in different units, so the unit travels with the row.

### Supplier terms

| Reference heading | Ours | Notes |
|---|---|---|
| Supplier | ✅ | |
| Supplier code | ➕ | |
| Product no. sup. | ➕ | the supplier's own article number for our product |
| Deliver time | ➕ | lead time |
| U.(deli… | ➕ | its unit — `D` on every row, so days |
| Min. OrderQty. | ➕ | we compute with it, we don't show it |
| U.(Moq.) | ➕ | its unit |
| Order series | ➕ | we compute with it, we don't show it |
| U(order… | ➕ | its unit |

### Stocking policy — the whole of it, exposed

| Reference heading | Ours | Notes |
|---|---|---|
| Min. Stock (Pur.U.) | ⚠️ | we compute it, then deliberately dropped the column |
| Max. Stock (Pur.… | ⚠️ | same |
| Min. Stk. Method… | ➕ | `0 (Factor x Avg.…)` — a **numbered enum** |
| Min. Stk. Fixed v… | ➕ | `0,00` |
| Min. Stk. Factor … | ➕ | `1` |
| Max. Stock Meth… | ➕ | `0 (Factor x Avg.…)` |
| Max. Stock Fixed… | ➕ | `0,00` |
| Max. Stock Facto… | ➕ | `3` |

**This confirms our policy model outright.** `ProductGroups.minStockMode` /
`minStockMultiplier` / `minStockFixedValue` is exactly the shape on screen:
a method, a fixed value, and a factor. Factor `1` for the minimum and `3` for
the maximum match the product-screen text we had already read
(*"Min. stock: 1 times the avg. monthly consumption; Max. stock: 3 times"*).

The one thing it adds is that **the method is numbered** — `0` is
`Factor x Avg.…`, so there are at least values `1`, `2`, … we have never seen.
Ours has two modes (`multiplier`, `fixed_value`); the reference may have more.

It also means dropping `Min level` / `Max level` from our 18 was the right call
for that *view*, but the figures do belong to the screen.

### Position, in the purchase unit

| Reference heading | Ours | Notes |
|---|---|---|
| Stoch (Pur.U.) | ✅ | the reference system's own typo for "Stock" |
| Available (Pur.… | ➕ | we show `Available (Kg)` only |
| Reserved (Pur.U.) | ✅ | as corrected |
| Not reserved call-off (Pur.U.) | ❌ | **new concept** |
| Not reserved other (Pur.U.) | ❌ | **new concept** |
| Not covered other (Pur.U.) | ❌ | **new concept** |
| Blocked (Pur.… | ➕ | we filter blocked lots out; the reference counts them |
| Econ. stock (Pur.… | ➕ | we show the Kg version |
| Consign. | ❌ | consignment stock |
| Consign.KG | ❌ | the same in kilos |

Three demand buckets we model as one. The reference splits what is *not*
reserved and what is *not covered* into call-off versus other, which implies
call-off orders are tracked separately from ordinary ones.

### Incoming

| Reference heading | Ours | Notes |
|---|---|---|
| To be received short term (Kg) | ✅ | proved: excludes the reserved part of an open line |
| To be received short term (Pur.… | ➕ | same figure, purchase unit |
| To be received long term (Kg) | ❌ | **we do not model this at all** |
| To be received long term … | ❌ | same, purchase unit |

Long term sits beside short term in both units, so it is a genuinely separate
figure — not a rename. Most likely a firm requirement further out than the
current order book: mill capacity booked, or a call-off contract not yet drawn
against.

### Demand

Fourteen consumption columns, each of them in two units:

| Window | Bare | (Kg) |
|---|---|---|
| previous month | Consumption previous month | Consumption previous month (Kg) |
| last 3 months | Consumption last 3 months … | Consumption last 3 months … |
| last year | Consumption last year (Pur.… | Consumption last year (Kg) |
| avg/month, last 3 months | Avg. Monthly consumption last 3 month… | |
| avg/month, previous year | Avg. Monthly consumption previous yea… | |
| avg/month, last year | | Avg. Monthly consumption last year (Kg) |
| avg/month, last 2 years | Avg. Monthly consumption last 2 years | Avg. Monthly consumption last 2 years (Kg) |
| avg/month, last 3 years | Avg. Monthly consumption last 3 years | Avg. Monthly consumption last 3 years (Kg) |
| ratio | Avg. Monthly consumption 3 w.r.t. 1 year (…) | shows `0,00%` |

**"previous year" and "last year" are two different columns.** That is the
strongest possible confirmation of [QUESTIONS #1](../QUESTIONS.md): the
reference system distinguishes the two, so "last year" cannot mean the previous
calendar year — it is the trailing twelve months, exactly as the `SC304`
arithmetic showed.

The `3 w.r.t. 1 year` percentage is a trend indicator: the three-year average
against the one-year average, so a buyer can see demand rising or falling
without reading both numbers.

### Advice, coverage and money

| Reference heading | Ours | Notes |
|---|---|---|
| Advice Qty. (P… | ✅ | |
| Advice Qty. rounded | ➕ | a rounded twin of the above — we only round the weight |
| Advice Weight rounded | ✅ | |
| OrderQty (Pur.… | ✅ | |
| Technical Coverage | ✅ | |
| Economic Coverage | ✅ | |
| Replacement price | ➕ | € per `U(replacement price)` |
| Amount | ➕ | € — presumably advice quantity × replacement price |
| Turnover rate | ➕ | stock turns |

`Advice Qty. rounded` alongside `Advice Qty.` means the chain has four steps,
not three: weight → rounded weight → quantity → rounded quantity → order
quantity. Ours collapses the middle two.

## Every formula, proved against 5,535 real rows

Both views were exported from the reference system and kept in
[`exports/`](../exports/) — `order-advice-saved-view.tsv` (18 columns) and
`order-advice-full-view.tsv` (72 columns), 5,535 products each. Everything
below is checked against those rows, not inferred.

Seventeen products carry a stocking policy or a last-year demand; they are the
ones the arithmetic can be read off. The rest are dormant.

### The engine runs in the purchase unit, not in kilos

This is the finding that matters most, and it reverses an assumption of ours.

There is **no `Min. Stock (Kg)` and no `Max. Stock (Kg)`** among the 72 columns.
The policy exists only as `Min. Stock (Pur.U.)` and `Max. Stock (Pur.U.)`, it is
driven by `Avg. Monthly consumption last year (Pur.U.)`, and the advice comes
out as `Advice Qty. (Pur.U.)`.

`Advice Weight rounded` is **zero on all 5,535 rows** — including the two rows
that carry a real advice. `CAA1050030` is advised 6 pieces and shows an advice
weight of 0, because that product records no `Theoretical Weight/Pcs.` to
convert by. A kilo-first engine could not produce a quantity without first
producing a weight.

So the chain runs: **demand in purchase units → policy in purchase units →
advice in purchase units**, and the kilo columns are a reporting derivative.
Ours computes in kilos and converts at the end, which is the same chain
backwards.

### Average monthly consumption — 17 of 17 exact

`Avg. Monthly consumption last year = Consumption last year ÷ 12`, to one
decimal:

| Product | Consumption last year | ÷ 12 | Shown |
|---|---|---|---|
| `CAA1050030` | 28 | 2,333 | **2,3** |
| `PK304200315` | 41 | 3,417 | **3,4** |
| `PK304L120415` | 54 | 4,5 | **4,5** |
| `PK304L20021` | 9 | 0,75 | **0,8** |
| `PW304L0821` | 2 | 0,167 | **0,2** |

Every one of the seventeen matches. The divisor is 12 — not a count of months
with history.

### The longer windows — divisors 24 and 36, and "previous year" is the year before

`601003021` reads: last year 11, previous-year average 26, two-year average
13,5, three-year average 9.

```
previous year total : 26   × 12 = 312
last two years      : 13,5 × 24 = 324   ≈ 312 + 11   ✓
last three years    : 9    × 36 = 324   (identical — nothing in year three)
```

`PK304200315`: `95,5 × 12 = 1146`, and `41 + 1146 = 1187` against
`49,5 × 24 = 1188`. `PK30415021`: `112,8 × 12 = 1353,6`, and
`10 + 1353,6 = 1363,6` against `56,8 × 24 = 1363,2`.

So **"last year" is the trailing twelve months and "previous year" is the
twelve before that** — they are different windows, which is why both columns
exist. The two- and three-year averages divide by 24 and 36 flat, exactly as
[QUESTIONS #3](../QUESTIONS.md) guessed.

### Min and max stock — 17 of 17 exact, and the rounding is now known

```
Min = round(factor × avg monthly)        factor is 1 on every row
Max = 3 × round(avg monthly)
```

| Avg monthly | Min | Max |
|---|---|---|
| 2,3 | **2** | **6** |
| 0,9 | **1** | **3** |
| 3,4 | **3** | **9** |
| 4,5 | **5** | **15** |
| 4,2 | **4** | **12** |
| 0,1 | **0** | **0** |

The average is rounded to a whole purchase unit **first**, then the factor
multiplies. Rounding after multiplying would give `round(3 × 2,3) = 7`, and the
data says 6. Half rounds up: `4,5 → 5`.

`Min. Stk. Method (Pur.U.)` turns out to hold the computed level with the method
name appended — `"2 (Factor x Avg.Mnt.Usg.)"` on the row whose
`Min. Stock (Pur.U.)` is 2. Across all 5,535 rows **only one method appears**,
`Factor x Avg.Mnt.Usg.`, and every `Fixed value` is zero. Our `multiplier` mode
covers the whole catalogue; `fixed_value` is never used.

### The position — exact on every row

```
Available (Pur.U.)  = Stoch (Pur.U.) − Reserved (Pur.U.)
Econ. stock         = Available + To be received short term
Not covered other   = Available          (in this data)
```

Thirteen rows check out on the first, including `PK30415021` at
`1783 − 416 = 1367` and `PK44110025125` at `59 − 44 = 15`.

`Not covered other (Pur.U.)` equals `Available (Pur.U.)` on all 252 rows that
carry one — because every reservation bucket beside it is empty. It is
available stock not matched to demand, and with no call-offs in this data it
collapses onto available.

### Both coverages — 14 of 14 exact

```
Economic Coverage  = Econ. stock (Pur.U.) ÷ Avg. Monthly consumption last year
Technical Coverage = Stoch (Pur.U.)       ÷ Avg. Monthly consumption last year
```

| Product | Econ ÷ avg | Shown | Stoch ÷ avg | Shown |
|---|---|---|---|---|
| `601003021` | 489 ÷ 0,9 = 543,33 | **543,3** | 500 ÷ 0,9 = 555,56 | **555,6** |
| `PK304L200315` | 231 ÷ 0,1 = 2310 | **2310** | 355 ÷ 0,1 = 3550 | **3550** |
| `PK304200315` | 977 ÷ 3,4 = 287,35 | **287,4** | 1336 ÷ 3,4 = 392,94 | **392,9** |
| `PK30415021` | 1367 ÷ 0,8 = 1708,75 | **1708,8** | 1783 ÷ 0,8 = 2228,75 | **2228,8** |

Months of cover against the trailing year's average, in purchase units. That is
what ours computes, in kilos.

### The advice — both rows exact

Only two of 5,535 products are advised anything, and both follow the rule ours
already implements:

```
advice = econ. stock < min stock  ?  max stock − econ. stock  :  0
```

| Product | Min | Max | Econ. stock | Advice | Rounded | OrderQty |
|---|---|---|---|---|---|---|
| `CAA1050030` | 2 | 6 | 0 | **6** | 6 | 6 |
| `PK43015021` | 1 | 3 | 0 | **3** | 3 | 3 |

`PK43015021` is the instructive one: it holds 40 pieces but every one of them
is reserved, so its economic stock is 0 and it is advised despite a full shelf.

`Advice Qty.`, `Advice Qty. rounded` and `OrderQty` are identical on both rows
because neither product carries an order series or a minimum order quantity —
those columns are zero across the whole file. The three-step chain is real but
collapses when the supplier terms are blank.

### `Avg. Monthly consumption 3 w.r.t. 1 year (%)` — a ratio, not a percentage

```
= Avg. Monthly consumption last 3 years ÷ Avg. Monthly consumption last year
```

`CAA1050030`: `1,2 ÷ 2,3 = 0,521739130434783`, which is the value stored to
fifteen decimals. `PK304L200315`: `87,9 ÷ 0,1 = 879`. The heading says `(%)` but
nothing is multiplied by a hundred.

### `Turnover rate` — close to consumption ÷ stock, but not exactly

Nine of eleven rows fit `Consumption last year ÷ Stoch`:
`PK304L400315` is `50 ÷ 8 = 6,25 → 6,3`; `PK44110025125` is
`7 ÷ 59 = 0,119 → 0,1`. But `PK304L120415` gives `54 ÷ 104 = 0,52` against a
shown `0,4`, and two rows carry a turnover rate with **zero** stock, which the
formula cannot produce. The denominator is therefore an *average* stock over the
year rather than the closing figure. Not reconstructible from this export.

### What is simply not used

Zero on all 5,535 rows, in both units where two exist:

| Column | |
|---|---|
| `To be received long term` | never populated |
| `Not reserved call-off` | never populated |
| `Consign.` / `Consign.KG` | never populated |
| `Order advice code` | empty on every row |
| `PAC-Code` | empty on every row |
| `Deliver time`, `Min. OrderQty.`, `Order series` | all zero |
| `Replacement price`, `Amount` | all zero |
| `Min./Max. Stk. Fixed value` | all zero |

Three of these were open Tier 1 questions. They are answered by absence: the
business does not use long-term receipts, call-off reservations or consignment
stock, so none of them needs modelling.

### The unit columns, as actually used

| Column | Values |
|---|---|
| `Purchase U.` | `TN` 3058 · `ST` 1756 · `M1` 721 |
| `U(order series)` | same three, matching `Purchase U.` row for row |
| `U(replacement price)` | `HK` 3066 · `KG` 1368 · `TN` 952 · `M1` 138 · `ST` 11 |
| `U.(delivery time)` | `D` on 5525 rows, blank on 10 — days |
| `U.(Moq.)` | blank on every row |

Five of the eight purchasing units appear in live data, `HK` among them. The
eight-value enum was right, and nothing outside it occurs.

`Main group` takes four values across the catalogue: `Steel` 3066,
`Stainless Steel` 1610, `Aluminum` 858, `Packaging` 1. `Stock product` is
`True` on every row, which confirms the screen filters to stock products the
way ours does.

## Verified against the reference, row for row

The export was loaded into our own database and the real `getOrderAdvice`
Server Action was driven against it, then every figure diffed against the
export it came from. On the 262 products that carry stock or demand:

| Column | Match | Differ |
|---|---|---|
| Stock (Pur.U.) | **262** | 0 |
| Reserved (Pur.U.) | **262** | 0 |
| Advice Qty. (Pur.U.) | **262** | 0 |
| OrderQty (Pur.U.) | **262** | 0 |
| Economic Coverage | **262** | 0 |
| Technical Coverage | **262** | 0 |

And the advice itself agrees on which products and how much: the reference
advises `CAA1050030` 6 and `PK43015021` 3, and so do we — nothing more,
nothing less, out of 5,399 rows.

Getting there took two corrections that only a real dataset could have
surfaced.

### The position is held natively, not converted from a weight

The reference prints `Stoch (Pur.U.) 102` for a product whose
`Theoretical Weight/Pcs.` is **blank**. It cannot be converting a weight,
because there is no weight to convert — it holds the count.

Ours derived every purchase-unit column by converting `Stock.quantityKg`, so
two thirds of the catalogue came back `—`. The stock aggregate now sums
`Stock.quantity` and `Stock.reservedQuantity` alongside the weighed column, and
the purchase-unit figures use the count whenever the product is stocked in the
unit it is bought in, falling back to the conversion only when those differ.
The same applies to the open purchase lines and to invoiced demand.

This is what makes the policy work at all for a weightless product: without a
demand figure there is no minimum, and without a minimum there is never an
advice.

### Coverage divides by the printed average, not the exact quotient

`601003021` sold 11 units in the trailing year. The exact monthly average is
`11 / 12 = 0,91666…`, and its economic stock is 489.

```
489 / 0,91666…  =  533,5     what ours computed
489 / 0,9       =  543,3     what the reference prints
```

The reference divides by **0,9** — the figure it displays, rounded to one
decimal. Two more rows confirm it: `PK304200315` gives `977 / 3,4 = 287,4`
(not `977 / 3,4167 = 286,0`), and `PK304L200315` gives `231 / 0,1 = 2310`
(not `231 / 0,0833 = 2772`).

So the rounding is not cosmetic — it is part of the arithmetic, and the monthly
average is rounded to one decimal before anything divides by it or multiplies
it.

### How to reproduce

Three scratch scripts, in order:

1. **seed** — reads `exports/order-advice-full-view.tsv` and writes
   `ProductGroups`, `Products`, `Stock`, and a `Company -> Order -> Stock ->
   OrderItem -> Invoice -> InvoiceItem` chain carrying each product's last-year
   consumption. Additive and idempotent: every UUID is derived from
   `product code + main group + product group`, and every insert is
   `ON DUPLICATE KEY UPDATE`. A product code appears twice under different
   groups 141 times, so the group has to be part of that key.
2. **verify** — loads the Server Action through `jiti` with the `@/` alias
   pointed at `apps/dashboard/src`, calls it against the live database, and
   diffs each column against the export.
3. The invoice date is set six months back, far enough inside the trailing
   twelve months to count as demand without landing in last calendar month,
   where `Consumption previous month` would pick it up.

## Policy

The *Stock policy* panel on a product spells the rule out, and it matches our
implementation clause for clause. Each side is a **radio button** — a factor or
a fixed value, never both — which is exactly `minStockMode` / `maxStockMode`:

> **Minimum stock**
> ◉ `1,00` times the average monthly consumption, **but at least** the value
> entered behind "Fixed value".
> ○ Fixed value: `0` ST

> **Maximum stock**
> ◉ `3,00` times the average monthly consumption, **but if a value greater than
> zero is entered behind "Fixed value", then a maximum of that value.**
> ○ Fixed value: `0` ST

Read carefully, the two are not symmetrical, and ours already had it right:

| | Reference wording | Ours |
|---|---|---|
| Min | factor × avg, *but at least* fixed | `Math.max(multiplier × avg, fixed)` |
| Max | factor × avg, *capped at* fixed when fixed > 0 | `fixed > 0 ? Math.min(…) : …` |

The banner above the panel repeats it in prose — *"Min. stock: 1 times the avg.
monthly consumption; Max. stock: 3 times the avg. monthly consumption"* — and
the factors `1` and `3` are the same ones the full grid shows in
`Min. Stk. Factor` and `Max. Stock Factor`.

Nothing is advised until the economic stock has actually fallen through the
minimum; then it is topped up to the maximum.

## 🔴 Open questions

Each one is a figure that is currently a defensible guess. What ours does today
is stated so a wrong answer is a one-line change.

**1. Answered — "short term" is not a date horizon at all. It excludes the
reserved portion of an open PO line.**
Checked on `PW304L0525125` (Hot-rolled plate 304L): its one open PO line
(401010/10) has `Qty(p)=5`, `Reserv...=2`, `Kg still to be received=613,3`.
Order advice shows `To be re...=367,98`. `613,3 × (5−2)/5 = 367,98` — exact.
So the formula is `kgPurchased × (quantity − qtyReceived − reservedQty) /
quantity`. **Implemented** — `order-advice/actions.ts` now subtracts
`reservedQty` (and coalesces both subtrahends, since either can be NULL on an
older row). `PurchaseOrderItems.reservedQty` already existed, so no schema
change was needed.

This also reframes the sibling column on
[StockOn advice](stockon-advice.md): `To be received short term (Pur.U.)` is
very likely this same unreserved-remainder figure in the purchase unit, and
`To be received long term (Pur.U.)` a separate, further-out figure (future
mill production not yet on a firm PO) — worth confirming once that screen is
tackled.

**2. "Avg. Monthly consumption last year" — trailing 12 months, or last calendar year?**
Ours uses trailing 12 months ÷ 12. "Last year" could mean the previous calendar
year ÷ 12, which gives a different number for most of the year.
→ *In the old system:* find a product with steady sales, note the figure, and
compare it against its invoiced weight for the previous calendar year ÷ 12 and
for the trailing 12 months ÷ 12. Whichever matches is the definition.

**3. "Consumption previous month" — previous calendar month, or trailing 30 days?**
Ours uses the previous calendar month.
→ *In the old system:* same method. Pick a product invoiced early this month; a
calendar-month figure will ignore those invoices, a trailing-30-day one will not.

**4. "Avg. Monthly consumption last 3 years" — 36 months ÷ 36?**
Ours does that. It could also be the mean of three separate yearly averages,
which differs when a product's history is shorter than three years.
→ *In the old system:* find a product first sold ~18 months ago. Dividing by 36
halves the figure; dividing by months-with-history does not.

**5. What counts as "consumption"?**
Ours counts **invoiced** lines. It could equally be delivered lines, or stock
movements out to a customer — and `Stock mutations` does record
`Levering / To customer`, so a movement-based definition is plausible. Every
consumption column, both coverages and the whole advice depend on this.
→ *In the old system:* find a product delivered but not yet invoiced. If its
consumption already includes that delivery, it is movement- or delivery-based,
not invoice-based.

**6. Coverage — in what unit, and against which consumption?**
Ours reports months of cover against the last-year average. The footer showed
`AVR=1,1` and `AVR=1,49`, which is consistent with months but also with a ratio
against the minimum stock level.
→ *In the old system:* take one line and read off its `Econ. stock (Kg)` and its
three consumption columns. If Economic Coverage = econ. stock ÷ avg-monthly-last-year,
ours is right; if not, try the other two consumption columns, then min stock.

**7. "Advice Weight rounded" — rounded to what?**
Ours rounds to whole kilograms. It could be rounded to the order series, or to a
per-product rounding step.
→ *In the old system:* find a line with a non-zero advice and compare it against
that product's order series and minimum order quantity. If the advice weight is
already a multiple of the series, the rounding is to the series, not to 1 kg.

**8. Answered — which units can "Pur.U." be?**
This screen showed a product bought by the tonne (`Available (Kg) 28,00` →
`Stock (Pur.U.) 0,03`) while our `purchasingUnits` held only `HS` and `ST`, so
the three Pur.U. columns came back empty for any such product.

The dropdown's actual option list (read off product
`582004002/06`, Stainless steel 304 square tube):

| Code | Meaning |
|---|---|
| `HK` | One hundred kilograms |
| `HM` | One hundred meters |
| `HS` | One hundred pieces |
| `KG` | Kilogram |
| `M1` | Meter |
| `MM` | Millimeter |
| `ST` | Pieces |
| `TN` | Tonnage |

Eight values, not two — and note it is exactly `salesUnitOptions` minus
`M2`, which the codebase already carried in full, with these same English
labels. A square metre prices a coated sheet; it does not order one.

**Implemented** — `purchasingUnits` widened to all eight, `PURCHASING_UNIT_LABELS`
filled in from the reference's own wording, and the 17 `enum('HS','ST')`
columns in the database widened to match. Widening an enum keeps every stored
value legal, so no data moved.

This also **confirms the Stock (Pur.U.) formula**, not just the unit list. The
same product's Order advice row reads `Stoch (Pur.U.) 7,00` against
`Available (Kg) 105,00` while its own Purchasing unit is `ST` — and
`105 ÷ 7 = 15` kg/piece, matching `convertKgToUnit(kg, "ST", weightPerPiece)`
exactly (`kg / weightPerPiece`). And the earlier `Available (Kg) 28,00` →
`Stock (Pur.U.) 0,03` example is consistent with a `TN` product:
`28 ÷ 1000 = 0,028`, which rounds to `0,03` — confirming the `TN` branch
(`kg / 1000`) too.

`convertKgToUnit` now covers all eight. Two factors carry the list:
`Products.theoreticalWeight` (kg per piece) answers `ST`/`HS`, and
`Products.weightPerM1` (kg per running metre) answers `M1`/`HM`/`MM`; the
hundred-codes are those divided by a hundred, and `M2` still returns null
because no product records a weight per square metre.

## Smaller uncertainties

- **`Reserved` — answered: it counts in the purchase unit, not kilograms.**
  The heading is truncated on screen; widening the column reveals
  `Reserved (Pur.U.)`. Ours had assumed kilograms because the column to its
  right is `Available (Kg)` — wrong, and wrong by the conversion factor, which
  is 1000× on a product bought by the tonne.
  **Implemented** — the reserved figure is still derived and subtracted in
  kilos, because `Available (Kg)` is a kilo figure and the subtraction has to
  happen in one unit; it is converted on the way out instead. A product with no
  conversion factor now shows `—` here, the same as the other three `(Pur.U.)`
  columns.

  This makes four of the eighteen columns purchase-unit columns, not three, and
  is a reminder that a heading without a visible suffix is not a heading
  without a unit — it is a heading that has been cut off.
- **Row 1 of the capture had an empty `Description`** (product `1010006/06`),
  so a blank description is legitimate data, not a join failure.
