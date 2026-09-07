# Purchase lines

`Overviews → Purchase → Purchase lines`. Ours: `/purchase-lines`.

Every line of every purchase order, as one flat list — **544 rows** with the
default filter. This is the busiest screen in the group and the one the buyers
actually live in: nine saved views were captured, four of them named after a
person.

**Filters**: `Creation date` (from / u/i), `Only current purchasing lines`
(checkbox, **checked**), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show Purchase order · Quotes… | Purchase lines ·
Warehouse workorders. `Show Company` and `Show Purchase order` grey out until a
row is selected.

## The saved views — and what a "view" actually is

A view carries **a column set, a sort, a grouping and a filter**, all at once.
Nine were captured:

| View | Filter shown in the bar | Rows |
|---|---|---|
| `-empty-` | — | 544 |
| `Adrie` | *(none shown)* | 544 |
| `UK orders` | *(none shown)* — but adds a `Country` column | 544 |
| `Lopende inkooporders` | `Status In [Partially received, In progress, Provisional, Released]` | **534** |
| `Marco` | `Purchaser = Marco Borsboom` | 177 |
| `Hego Prod` | `Supplier = Hego Production And Not Product In [Blauwe Folie, Decoilen, Knippen, Laser Folie, Slijpen]` | 131 |
| `Benno` | `Purchaser = Benno Vos` | 82 |
| `Arian` | `Purchaser = Arian Bloks` | 66 |
| `Extern Prod` | `Purchase order type = Processing And Not Supplier Contains Hego` | 20 |

Two things follow for our build:

- **Views are per-user working sets, not alternative layouts.** Four are simply
  "my lines" for one buyer. Ours gets a `Purchaser` filter and a "mine" default
  rather than nine saved views.
- **`Extern Prod` vs `Hego Prod` is the real distinction** — processing bought
  *outside* (`type = Processing` and supplier not Hego) against processing done
  *in-house* (`supplier = Hego Production`). `Hego Production` is the company's
  own production department appearing as a supplier.

`Lopende inkooporders` is Dutch for *current purchase orders*, and its explicit
status filter is what makes the status list below readable. Note it returns
**534** where the unfiltered view returns 544, so **10 rows carry a status
outside those four** — the `Checked` value seen in the `Arian` view.

## Columns — the full palette from `View = -empty-`

Roughly fifty. Grouped by what they are rather than by position:

**Identity**

| Column | Notes |
|---|---|
| `Purchase order type` | reads `Purchase order` — the **document kind** |
| `No.` · `Line` | order number and line number (steps of 10) |
| `Product code` · `Product` | code and assembled description |
| `Supplier` | the name |
| `Company code` | **the supplier's code** — `10631` = Aperam Service, `13660` = Hego Production, matching the receivals export |
| `Country` | the supplier's country, **in Dutch** — `Nederland`, `Germany`, `Belgium`, `Italië` |
| `Date Created` · `Receipt date` | |
| `Purchaser` · `Initials purch…` | |

**The second `Purchase order type`, and `Line type`**

| Column | Values |
|---|---|
| `Purchase ord…` | **`Materials`** · **`Processing`** |
| `Line type` | **`Stk`** · **`CD`** |

**Quantities and weights**

| Column | Notes |
|---|---|
| `Qty(p) (Pur.U.)` · `Purchase U.` | planned quantity and its unit (`ST`) |
| `Qty(a) (Pur.U.)` | actually received |
| `Qty ordered` · `Qty confirmed` | see below — process flags, not quantities |
| `Qty still to b…` | `Qty(p) − Qty(a)` |
| `Reserved (Pur.U.)` · `Reserved (kg)` | |
| `Available (Pur.U.)` · `Available (kg)` | **derived — see below** |
| `Kg(pur)` · `Kg(a)` · `Kg. still to be…` | |
| `Length (mm)` · `Width (mm)` · `Thickness` | |

**Money**

| Column | Notes |
|---|---|
| `Net Purchase Price` · `PriceU` | the price and **its own unit** (`TN` / `KG`) |
| `Amount(p)` | price × weight — **exact, see below** |
| `Amount yet to be received` | price × `Kg. still to be received` |
| `Current gros…` (Current gross price) · `Gross pri…` (`Gross price U`, tooltip-confirmed) | |
| `Margin (€ per gro…)` | **dead — see below** |

**Classification and references**

`Main group` · `Subgroup` · `Revenue group number` · `Revenue group` ·
`Quality Code` · `Stock Category` · `Options` · `Status` ·
`Purchase Refere…` · `Onze referentie` · `CE standard` · `DoP` ·
`Deadline/Valid until`

`DoP` is a *Declaration of Performance* — the construction-products document
that pairs with `CE standard`. Both are blank on every visible row.

## ✅ `Amount(p)` = price × weight, in the price's own unit

Proved to the cent, and it works in **both** price units:

| Line | Price | Unit | Weight | Amount | Shown |
|---|---|---|---|---|---|
| 401141/10 | € 2 000 | TN | 10 598 kg | 21 196,00 | **21 196,00** |
| 401036/10 | € 3 160 | TN | 3 490 kg | 11 028,40 | **11 028,40** |
| 400253/40 | € 1 930 | TN | 345,4 kg | 666,62 | **666,62** |
| 401005/10 | € 3,60 | **KG** | 407 kg | 1 465,20 | **1 465,20** |

So a `TN` price divides the weight by 1 000 and a `KG` price does not — the
`PriceU` column decides. Note `400253/40` reconciles with the same line on
[Purchase receivals](purchase-receivals.md) and
[the order detail](purchase-order-detail.md), so three screens agree on it.

**And `Kg(pur)` is a rounded display, not the stored value.** Three rows only
reconcile against the *exact* density weight:

| Line | Exact kg | `Kg(pur)` shows | price × exact |
|---|---|---|---|
| 400195/30 | 565,20 | 565 | **1 740,82** ✓ |
| 401073/10 | 3 532,50 | 3 533 | **7 065,00** ✓ |
| 400920/10 | 1 381,60 | 1 382 | **4 835,60** ✓ |

Those exact weights come from
`length × width × thickness × density` — [the product master's
formula](../product-detail.md#-the-weight-formula-proved) — reproduced here on
**seven of seven** rows. It is the fourth screen to confirm it.

## ✅ `Available` is derived, and it is not the stock figure

`Available = Qty(p) − Qty(a) − Reserved`, clamped at zero, **in both units** —
seven of seven rows:

| Line | Qty(p) | Qty(a) | Reserved | Available | kg |
|---|---|---|---|---|---|
| 401141/10 | 100 | 0 | 90 | **10** | 10 598 − 0 − 9 538 = **1 060** ✓ |
| 401073/10 | 50 | 0 | 25 | **25** | 3 533 − 0 − 1 766 = **1 767** ✓ |
| 400253/40 | 11 | 9 | 2 | **0** | clamped ✓ |
| 400648/20 | 187 | 171 | 16 | **0** | clamped ✓ |

So "available" on a purchase line means **still coming and not yet promised to
anyone** — a different thing from the warehouse's
`Available = Technical − Reserved`. Both exist; do not conflate them.

`Kg. still to be received = Kg(pur) − Kg(a)`, and
`Amount yet to be received` = price × that: `1 930 × 0,0474 = 91,48` on
`400253/40`, `2 490 × 1,103 = 2 745,47` on `400648/20`. Both exact.

## ✅ `Qty ordered` and `Qty confirmed` are process flags

They are not quantities in the ordinary sense — each is either `0` or the full
line quantity, independently of the other:

| Line | Qty(p) | Qty(a) | Qty ordered | Qty confirmed |
|---|---|---|---|---|
| 401141/10 | 100 | 0 | **0** | **100** |
| 400797/10 | 62 | 0 | **62** | **0** |
| 400819/10 | 300 | 0 | **0** | **0** |
| 400253/40 | 11 | 9 | 11 | 11 |

So they record *has this been ordered with the supplier* and *has the supplier
confirmed it*, expressed as a quantity so a partial confirmation can be held.

**This settles the last open question on
[Purchase receivals](purchase-receivals.md#qtya-vs-received-qty--answered-and-not-the-way-it-looked).**
That screen's `Received Qty` — non-zero where nothing had arrived — is this
`Qty confirmed`. On `400253/40` both read 11; on `401076/10` both read 0.

## ✅ `Margin` is dead while `Current gross price` is zero

`Current gross price` is **€ 0,00 on every visible row**, and
`Margin (€ per gross unit)` is then exactly **minus the net purchase price** —
checked on ten rows, all ten. So `Margin = current gross price − net purchase
price`, and it carries no information until sales prices are maintained.

Same shape as [`Replacement value` on Purchase
results](purchase-results.md#-dead-columns). Worth one glance before building
either column.

## 🔑 Processing options are purchased as their own lines

The `Extern Prod` and `Hego Prod` views show lines whose `Product code` is a
processing step, not material:

| Code | Product |
|---|---|
| `D` | Decoilen (decoiling) |
| `SL` | Grinding (*Slijpen*) |
| `BF` | Blue Foil (*Blauwe Folie*) |
| `LSR` | Laser |
| `K` | Knippen (cutting) |
| `ShearCut` | ShearCut |

They carry `Qty(p) = 0` and `Kg = 0`, a `Net Purchase Price`, and an
`Amount(p)` — so they are **service lines against a parent material line**,
which is what the order detail's `For line` column is for.

**And they are priced two different ways, both proved to the cent** on order
`400904`, whose parent lines are 1,25 mm plate:

| Option | Price | Basis | Check |
|---|---|---|---|
| Blue Foil | € 1,40 | **per m²** | `2,2 × 1,0 × 28 = 61,60 m² → € 86,24` ✓ |
| Blue Foil | € 1,40 | per m² | `2,15 × 1,0 × 50 = 107,50 m² → € 150,50` ✓ |
| Grinding | € 1,70 | per m² | `61,60 × 1,70 = € 104,72` ✓ |
| Grinding | € 1,70 | per m² | `107,50 × 1,70 = € 182,75` ✓ |
| Decoilen | € 110,00 | **per tonne** | `0,6045 t × 110 = € 66,49` (shown 66,50) ✓ |
| Decoilen | € 110,00 | per tonne | `1,0548 t × 110 = € 116,03` (shown 116,04) ✓ |

So the surface treatments bill by **area** and the decoiling bills by
**weight**, and both take their measure from the parent line's dimensions and
quantity. This is very likely the mechanism behind the unexplained over-billing
on [the order's `Previous orders`
panel](purchase-order-detail.md#previous-orders) — options adding amounts on
top of the material.

## ✅ Answers to the old questions

**`Status` is line-level, and it has at least seven values.**
`Provisional` → `In progress` → `Released` → `Checked` → `Partially received` →
`Received` → `Invoiced` (the last two from the
[receivals export](purchase-receivals.md)). `Checked` appears only here.

Proof that it is per line, not per order: order `400253` shows line `40` as
`Partially received` and line `50` as `Released`. Order `400150`'s six lines are
all `Checked`; order `400983`'s six are all `Released`.

**`Line type` is `Stk` or `CD`.** `Stk` is for stock; `CD` matches the purchase
order header's `Pick up/Drop-off CD-purchases` checkbox, so it is a
direct-delivery purchase that does not land in our warehouse.

**`Receipt date` is planned, and frequently overdue.** Rows dated `29-4-2025`
still read `Released` with the system date at `7-9-2026`. So this screen doubles
as a late-delivery list.

**`Thickness` is a decimal**, confirmed by real values: `2,057`, `1,52`,
`1,46`, `0,99`, `0,74`, `0,69`, `0,52`, `4,97`. `Length` and `Width` are whole
millimetres. Our schema already models it that way.

**`Company code` is the supplier's code**, not a branch or affiliate — `10631`
is Aperam Service both here and in the receivals export.

**`Purchase Reference` is free text.** Values range from `Test 1` and
`knippen` through `tbv Knake` and `rvs 304L 2b 3.1` to supplier order numbers
like `K250147861` and `941162`. A few look like our own order numbers
(`400394 / 23022`, `400915/P08105`) but most do not, so it cannot be treated as
a link. `Onze referentie` (*our reference*) sits beside it — `E2T-23653 test`.

**`Revenue group` is a grade family with a numeric code**: `1000` = `SS 304`,
`1100` = `SS 316`, `1300` = `SS 430`.

**`Stock Category`** takes one observed value, `2nd choice`, and is otherwise
blank — so it flags off-spec material rather than categorising everything.

**`Quality Code`** is the product's quality plus its finish: `304L`, `304L2B`,
`3042B`, `304LSB`, `316L2B`, `430BA`, `316`, `304`. The product master carries
`Quality` = `316L` under Features, so this is joined in from the product.

## ⚠️ Two things not to copy

**The footer sums `Net Purchase Price`.** The `Adrie` view's footer reads
`SUM=1.982.540` (kg), `SUM=€840.860,75` (**prices**), `Som=€3.849.900…`
(amounts), `SUM=€3.741.298,66` (amount yet to be received). Adding up prices
per tonne across 544 lines is a meaningless number. Ours sums the weights and
the amounts only.

**The footer mixes languages** — three `SUM=` labels and one `Som=` (Dutch).

## 🔴 What is still needed

1. **`Only current purchasing lines` — the row count with it unchecked.** The
   checked count is 544, and `Lopende inkooporders`' status filter takes that to
   534, so the checkbox is *not* the same as a status filter.
   → *In the old system:* uncheck it, press `Show Data`, note the count, and see
   what the extra rows have in common.
2. **Does the `Hego Prod` filter's second clause actually apply?** It reads
   `Not Product In [Blauwe Folie, Decoilen, Knippen, Laser Folie, Slijpen]`, yet
   `Blue Foil` and `Grinding` rows are in the result. Either the clause is
   switched off or it matches on Dutch names the grid translates.
3. **`Qty ordered` vs `Qty confirmed` on a partly-confirmed line.** Order
   `400648/20` shows `Qty(p) = 187`, `Qty ordered = 173`, `Qty confirmed = 187`
   — the one row where ordered is neither 0 nor the full quantity.
   → *In the old system:* open that line and see which figure is editable.
