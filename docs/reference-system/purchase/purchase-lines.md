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


---

## ✅ Live re-proof, 5-10-2026 — `Amount(p) = Net Purchase Price × Kg(pur)`

Captured on `Purchase lines`, creation date `1-1-2020` → `5-10-2026`,
**`Only current purchasing lines` unticked**, 23 rows of 2026 orders
(`404133`–`404449`, all `Released`, Aperam and Holland Stainless).

This matters because every earlier proof of the formula came from the frozen
mid-May-2025 export. These are **live rows on today's data** and they land on
the cent.

| Kg(pur) | Net Purchase Price | PriceU | Amount(p) | price × kg |
|---|---|---|---|---|
| 2 690 | € 3 305,00 | TN | **€ 8 890,45** | `3305 × 2,690` = 8 890,45 ✅ |
| 1 500 | € 3 100,00 | TN | **€ 4 650,00** | `3100 × 1,500` = 4 650,00 ✅ |
| 5 652 | € 2 490,00 | TN | **€ 14 073,48** | `2490 × 5,652` = 14 073,48 ✅ |
| 1 000 | € 3 970,00 | TN | **€ 3 970,00** | `3970 × 1,000` = 3 970,00 ✅ |
| 8 000 | € 3 880,00 | TN | **€ 31 040,00** | `3880 × 8,000` = 31 040,00 ✅ |

🔑 **`Kg(pur)` is displayed rounded to whole kilos but stored with decimals.**
Four rows look a cent or two out until you invert them:

| Shown Kg(pur) | Amount(p) ÷ price | Actual kg |
|---|---|---|
| `2.014` | 4 268,83 ÷ 2 120 | **2 013,6** |
| `7.948` | 16 850,18 ÷ 2 120 | **7 948,2** |
| `2.120` | 4 493,34 ÷ 2 120 | **2 119,5** |
| `1.342` | 3 476,82 ÷ 2 590 | **1 342,4** |

So the grid rounds the weight for display and computes on the stored figure.
**Our grid must do the same** — rounding the weight *before* multiplying would
put every one of these lines a euro out.

### `Qty confirmed` is a real, used field

Line `404133/20`: **`Qty ordered` 42, `Qty confirmed` 38**, and `Qty(p)` reads
**38**. The supplier came back short and the line was revised down to what they
would actually send. `Kg. still to be delivered` follows the confirmed figure,
not the ordered one.

We hold no confirmed quantity at all. A line needs **ordered**, **confirmed**
and **received** as three separate numbers.

### Goods are reserved before they arrive

`Reserved (Pur.U.)` on `Released` lines with nothing yet received:

| Line | Qty(p) | Reserved |
|---|---|---|
| `404417/10` | 45 | **45** — all of it |
| `404343/10` | 75 | **75** |
| `404317/40` | 95 | **95** |
| `404235/30` | 32 | **3** — part |
| `404427/10` | 135 | 0 |

🔑 The purchase side of what H5 found on the sales side: **metal is sold
before it exists**, and the reservation is carried on the *purchase line* until
the lot it becomes can take it over.

### `Line type` — two values seen, meaning unknown

**`Stk`** on most rows, **`CD`** on six (`404417/10`, `404316/10`, `404316/20`,
`404247/10`, `404247/20`, `404415/10`).

⚠️ **Hypothesis only:** `Stk` = goes to stock, `CD` = cross-dock / direct
delivery. It is **not** a coil-vs-plate split — `404417` and `404415` are
plates and carry `CD`, while plenty of coils carry `Stk`. **Do not build on
this.** J6's grouping (`Purchase lines → Line type`) is what settles it, and
`Stk vs CD` is already an open question from the 10-9 sales batch.

### Confirmations in passing

- **`999999` in `Length (mm)` is the coil sentinel**, live on six rows — all
  `CK316L…` coils. `COIL_LENGTH_SENTINEL` is correct
- Coil **`Width`** carries the slit width: `40`, `110`, `1000`, `1015`, `1018`
- **`Purchase order type` on the line reads `Materials`**, the same enum the
  order overview groups by
- **`Kg(a)` is `0` on every row** — all `Released`, nothing weighed yet, which
  is exactly the invariant our receipt chain depends on

### The filter block, for the record

`Creation date` `vanaf` / `t/m`, and a tickbox **`Only current purchasing
lines`** which **hides closed orders** — it is on by default and is why a
search for an old order returns nothing. The `Find` box beside the grouping bar
searches **rows already loaded**; it is not a server-side filter and does
nothing until `Toon Gegevens` has run.

### 🔑 The `Status` enum — grouped 5-10-2026

Dragging `Status` into the grouping bar produced **five** groups:

```
Checked
In progress
Partially received
Provisional
Released
```

Three of these are new to us: **`Checked`**, **`In progress`** and
**`Provisional`**. We only had `Released`, `Partially received`, `Received` and
`Invoiced`, the last two from the order-detail capture.

⚠️ **`Received` and `Invoiced` did not appear as groups**, although the
order-detail capture showed both on real lines. Either the load still had
`Only current purchasing lines` ticked — which hides closed lines — or a line
leaves this screen once it is fully received. Worth settling, because it decides
whether `Purchase lines` is the whole book or only the open part of it.

⚠️ **The group headers carry no counts** on this grid, unlike the value-list
groupings J6 is after. So this answers *which* values exist, not how many of
each.

Do not treat the list as complete until the `Only current purchasing lines`
question above is settled.


---

## ✅ Step 6 answered, 7-10-2026 — `Line type`, grouped

`Purchase lines`, creation date `1-1-2024` → `7-10-2026`, `Only current
purchasing lines` **off**, grouped on `Line type`. Three groups, collapsed:

```
⊞ Line type: CD
⊞ Line type: EXW
⊞ Line type: Stk
```

🔴 **Three, not two.** The hypothesis above (`Stk` or `CD`, derived from the
header's `Pick up/Drop-off CD-purchases` tick) was how our overview computed
the column — and a tick can only ever produce two values. `EXW` is a third that
no header field can say, so **the line type is a property of the line**, and
that is how it is now stored (`PurchaseOrderItems.sourceType`, 7-10-2026).

⚠️ As before on this grid, **the group headers carry no counts.** `CD` and `Stk`
were left collapsed, so their sizes are unknown. `EXW` was opened: **one row**.

### The one `EXW` line, read across the full width

| Column | Value |
|---|---|
| `Purchase order type` *(first column — the document kind)* | `Purchase order` |
| `No.` / `Line` | **`400143`** / `10` |
| `Product code` / `Product` | `CK304L0050` — `Coil Cold-rolled 304L` |
| `Supplier` / `Company code` / `Country` | **`Decomecc N.V.`** / `11046` / `Belgium` |
| `Status` | **`Received`** |
| `Receipt date` / `Date Created` | `15-1-2025` / `14-1-2025` |
| `Qty(p) (Pur.U.)` / `Purchase U.` / `Kg(pur)` | `1` / `ST` / `177` |
| `Qty(a) (Pur.U.)` / `Kg(a)` | **`1`** / **`177`** |
| `Qty ordered` / `Qty confirmed` | **`0`** / **`0`** |
| `Reserved` (Pur.U. / kg) / `Available` (Pur.U. / kg) | `0` / `0` / `0` / `0` |
| `Revenue group number` / `Revenue group` | `1000` / `SS 304` |
| `Length` / `Width` / `Thickness` | `3000` / `1500` / `5` |
| `Net Purchase Price` / `PriceU` | **`€ 0,05`** / `TN` |
| `Amount(p)` / `Amount yet to…` | **`€ 0,01`** / `€ 0,00` |
| `Qty still to b…` / `Kg. still to be…` | `0` / `0` |
| `Purchase ord…` *(second column — the order's type)* | **`Ex works Pro…`** (truncated) |
| `Initials purch…` / `Purchaser` | `BV` / `Benno Vos` |
| `Main group` / `Subgroup` | `Stainless Steel` / `Coil Cold-rolled 304L` |
| `Current gros…` / `Gross pri…` | `€ 0,00` / `TN` |
| `Margin (€ per gro…` | **`€ -0,05`** |
| `Quality Code` | `304L2B` |
| `CE standard` · `Deadline/Valid until` · `DoP` · `Stock Category` · `Purchase Refere…` · `Onze referentie` · `Options` | all blank |

🔑 **This is not a purchase.** Four things on the row say so, and the exports
say the rest:

- **€ 0,05 per tonne.** 177 kg of 304L for one cent. A nominal price, there so
  that the receipt can post *something*.
- **`Qty ordered 0`, `Qty confirmed 0`, yet `Received`.** The order was never
  sent to the supplier and never acknowledged — and the goods arrived anyway.
- **Decomecc N.V. is a `LOON (E)` company** in `c2-customer-overview.tsv` —
  *loonwerk*, contract processing — not a mill.
- **The certificate is internal.** `e2-certificates-received.tsv` lists
  `IO400143/10` with certificate `INtern`, type `NVT` (n.v.t., not applicable);
  `e1-batches.tsv` shows it became batch **`25AATY`** on `2025-02-10`.
- **It was booked to stock at € 0,01.** `joumual-entires.tsv`: `Inslag
  inkooporder · Decomecc N.V. · 0.01 → 3000 Stock / 3170 Goods to be received`.

So the one `EXW` purchase line in 21 months is **our own metal coming back
from a processor's works**, booked in as a receipt against a nominal order so
that it gets a lot, a batch and a ledger line. The dimensions fit: 3000 × 1500
× 5 mm × 7 900 kg/m³ = 177,75 kg — a plate cut from the coil the code names,
weighed at 177. That is the external-processing return leg (**H9**), seen from
the purchase side.

⚠️ **`Ex works Pro…` is a purchase-order type we do not hold.** Ours are
`Materials` · `Processing` · `Customer Materials`. The full caption is cut off
in the grid — Step 6c (open order `400143`) is to read it.

⚠️ **Open:** whether the selling side's single `EXW` line (order-lines.md §8)
is the mirror of this — the processed plate going out — or something else.

### What was built on it, 7-10-2026 (commit `067f4cbe`)

- `PurchaseOrderItems.sourceType` — `stock` · `cross_dock` · `ex_works`
  (`purchaseSourceTypes`, a subset of `orderSourceTypes`, which gained
  `ex_works`). The overview reads it; the header tick is only the default a new
  line gets (`purchaseSourceTypeFor`); the line editor offers all three with a
  blank meaning "from the order"; the overview gained a `Line type` filter.
- `minimumMarginFor` is keyed on the type, and reads the cross-dock floor
  nothing had ever read. See [PLANNED-CODE-CHANGES-7.md](../PLANNED-CODE-CHANGES-7.md)
  for what this row still asks of the code.


### ✅ Step 6c, 7-10-2026 — order `400143` opened

Header: `Purchase order 400143, Decomecc N.V., Tel: 0032 89 61 15 46, Fax:
0032 8961 1519 - Received, Printed`.

| Field | Value |
|---|---|
| `Creation date` | `14-1-2025` |
| `Supplier` | `11046` Decomecc N.V. · `Agent` `-leeg-` · `Contact` Sige Geerkens · `Purchaser` Benno Vos |
| `Order category` | `-leeg-` |
| `Reference` | blank |
| **`Purchase reference`** | **`IO400142`** — the order number *before* this one |
| **`Purchase order type`** | **`Ex works Processor`** — the full caption behind `Ex works Pro…` |
| second type dropdown | `-leeg-` |
| `Overlength` | ☑ greyed · `Printed` ☑ · `Mailed` / `Faxed` / `StaalWeb` / `Do not print prices` ☐ |
| `Payment terms` | `Within 30 days from date of invoice` |
| `Delivery terms` | **`(FCA) Free carrier`** |
| **`Delivery address`** | **`Bilzerweg 8, B-3600, GENK (CENTRUM)`** — **Decomecc's own address** |
| `Date` ⦿ `15-1-2025` · `Week` `3` / `2025` | |
| Summary | Materials `€ 0,01` · Options `€ 0,00` · Surcharges `€ 0,00` · excl. VAT `€ 0,01` · VAT `€ 0,00` · incl. `€ 0,01` · **Total weight `177 Kg`** |
| Toolbar | `Return` · `Par. return` · `Pre-notify` · `Report completion…` greyed; `Confirm` · `Copy` · `Show company` live |
| Panels | `Workorders` → `Warehouse workorders` · `Production workorders` · `Transport workorders` (collapsed) |

Line, `1 line`: `Code 10` · **`For line` `IO400142/`** · `15-1-2025` ·
`Received` · `CK304L0050` `Coil Cold-rolled 304L 5 mm` · Category `Standaard`
· Quality `304L2B` · `3000 mm` × `1500 mm` × `5 mm` · `1 ST` · `177` kg ·
`M1(p) 3` · `€ 0,05 TN`.

🔑🔑 **Two fields settle what this is.** The delivery address is the
*processor's* premises — the plate was received while standing at Decomecc,
free carrier, and never came to our dock. And both `Purchase reference` and
the line's `For line` point at **`IO400142`**, the order raised the day before.
So `400143` exists *for* a line of `400142`: one order sent the coil out for
processing, the other books the processed plate back at a nominal cent, ex
works at the processor. **`Ex works Processor` is the return leg of external
processing (H9)**, and `EXW` is its line type.

⚠️ `Pick up/Drop-off CD-purchases` is not on this header's `Delivery` block;
it lives in the Logistics section, which was not scrolled to. Not needed — the
address says enough.

**Step 6d** opens `400142` to read the outgoing leg.


### 🔑 `400142` from the exports, 7-10-2026 — before it was opened

`400142` did not show on `Purchase lines` (the `Weergave` had drifted to
`Aankomende ontvangsten`, which hides it) nor on `Purchase orders and quotes`.
Two exports already hold it:

- **`joumual-entires.tsv`:** `IO400142 · Aanmaken/wijzigen inkooporder ·
  Decomecc N.V.` — **€ 1 324,16** on 17-1-2025, reversed and re-posted at
  **€ 1 261,10** on 10-2-2025, each time `3170 Goods to be received` against
  `1601 Invoices to be received`. No `Inslag` line: nothing was ever received
  on it. That is the processing bill.
- **`reversation.tsv`:** `CK304L0050 · Coil Cold-rolled 304L · 3000 · 00 Hego
  Almere · Bewerkers · Bewerker · 1 ST · 400142 / 10 · Decomecc N.V. ·
  Definitive (Purchase)`.

🔑🔑 **That second row explains the purchase-side reservations.** The export
holds **15** rows of `Reservation type = Definitive (Purchase)`, and every one
is at a location of type **`Bewerker`** (processor) — sections `Hego
Productions` and `Bewerkers` — binding one coil (`999999`, the coil sentinel,
on most) to a purchase order line whose company is the processor: Hego
Production, Hebels Staalservice, Decomecc. So the outgoing leg of external
processing is a **purchase order to the processor with our coil reserved to
it from the processor's location**, and the incoming leg is the `Ex works
Processor` order that books the result back (`400143`). Stock-lot-model's
"23 rows on the purchase side" were H9 all along.

Still to read off the order itself: its type (expected `Processing`), its
line, and its `Workorders` panels.


### ✅ Why `400142` could not be found, 7-10-2026

It is **`Expired`** — € 0,00, 0 kg, delivery date 16-1-2026 — and an expired
purchase order is shown on neither `Purchase lines` nor `Purchase orders and
quotes`. It was found on Decomecc's company record, `Purchase orders` panel
(company-detail.md *Decomecc*). Its type is `Processing`, as predicted. Its
lines and workorders are still unread: from that panel, select `400142` →
`Show`.


### ✅ G10 — what holds a lot at the processor, 7-10-2026

`Stock on location`, `Find` `Bewerkers`: **seven lots**, every one `Location
type` `Bewerker` and `Blocked` ☑ — `CK304L0050` and `CW304L0060` coils
(`999999`), `PK304L150` ×2, `PK304150315`, `PK30415021`, a second
`CK304L0050` at 3000 mm. Five are fully reserved, two not at all. The row's
context menu offers `Show Product · Change APP… · Toon reserveringen…`.

`Toon reserveringen…` on the first coil opens **`Reserveringen Bewerkers Coil
Cold-rolled 304L`**, toolbar `Order · Verwijder`:

| Type | Status | Hoeveelheid | Eenheid | Order/Regel | Bedrijf | Datum | Gewijzigd |
|---|---|---|---|---|---|---|---|
| `Purchase` | `Definitive` | 1 | ST | **`IO400366/10`** | Decomecc N.V. | **12-2-2025** | — |

🔑🔑 **The coil is reserved to a processing order that is already
`Invoiced`.** `400366` (Decomecc, `Processing`, 11-2-2025, € 1.364,40,
11 370 kg — company-detail.md *Decomecc*) was billed long ago, and the
reservation binding the coil to it is still `Definitive` twenty months
later. So **invoicing a processing order does not release its reservation,
and does not bring the metal home**: the lot stays at `Bewerkers`, blocked,
until somebody books the return leg (the `Ex works Processor` order, as
`400143` did for `400142`). Nothing has, for this one.

✅ **Why a `Bewerker` lot is blocked** is the location type, as
stock-lot-model already recorded — every lot at that location is blocked,
reserved or not. No dialog sets it per lot.

⚠️ `reversation.tsv` (mid-2025) listed a `CK304L0050` reserved to
**`400142/10`**. `400142` has since expired and that reservation is gone; the
coil seen today is reserved to `400366/10`. Whether it is the same coil moved
from one processing order to the next, or a second one, is not settled from
this view.


---

## ✅ J4, 7-10-2026 — short lines are closed, not left open

`Purchase lines` → `Toon in Excel` (16 084 lines, 50 columns), read through
COM. Lines where `Qty(a)` is above 0 but below `Qty(p)`: **23**.

**Only one is still open** — `404150/10`, `Partially received`, 1 of 3, the
Norder Band coil already captured on 6-10 with its two receptions. So a line
waiting for its remainder is rare: one in sixteen thousand.

**The other 22 arrived short and were closed anyway** — 20 `Invoiced`, 2
`Received`:

| Short by (pieces) | Lines | Examples |
|---|---|---|
| ≤ 5 % | **16** | `404074/10` 80 of 81 · `403701/10` 140 of 144 · `403166/10` 182 of 185 · `402951/10` 11,979 of 12 |
| 7,7–22 % | 5 | `403661/120` 24 of 26 · `403066/280` 7 of 8 · `401849/40` 16 of 20 · `401834/10` 85 of 108 (`Received`) · `400276/10` 42 of 54 |
| 64,7 % | 1 | **`401616/50` — 6 of 17, `Invoiced`** |

🔑🔑 **A short delivery closes the line; the shortfall is dropped, not
carried.** Sixteen of the 22 are within the 5 % receiving tolerance every
product carries (`Unloading wo 5 % / 5 %`), so for those the tolerance alone
explains it. The other six are 7,7 % to 64,7 % short and closed regardless,
so somebody also closes lines by hand — `401616/50` was invoiced at 6 of 17.

🔑 **`Invoiced` means "invoiced for what arrived", not "for what was
ordered".** A line billed on its weighed kilos (proved on `402532`) is fully
invoiced when the received quantity is, which is why the header ladder has
no `Partially invoiced` (purchase-orders-and-quotes.md *Status grouped*).

Kilos agree with pieces on most rows (`Kg(a)` short by roughly the same
percentage), and run *over* on a few (`401508/30` 236 of 237 pieces but
10 245 of 10 047 kg) — the weighbridge, not the count, decides the kilos.
